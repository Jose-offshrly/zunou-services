import { AssemblyAI } from 'assemblyai'
import { readFile, writeFile } from 'fs/promises'
import { env } from './env.ts'
import state from './state.ts'

interface SpeakerMapping {
  [key: string]: string
}

interface DiarizedUtterance {
  speaker: string
  text: string
  start: number
  end: number
  confidence: number
}

class AssemblyAIPostProcessor {
  private client: AssemblyAI

  constructor() {
    this.client = new AssemblyAI({
      apiKey: env.ASSEMBLYAI_API_KEY,
    })
  }
  
  // Dice coefficient for similarity matching
  private calculateSimilarity(str1: string, str2: string): number {
    const a = str1.toLowerCase().trim()
    const b = str2.toLowerCase().trim()
    
    if (a === b) return 1.0
    if (!a || !b) return 0.0
    
    if (b.includes(a) || a.includes(b)) {
      const shorter = a.length < b.length ? a : b
      const longer = a.length >= b.length ? a : b
      return shorter.length / longer.length
    }
    
    const aBigrams = new Set<string>()
    for (let i = 0; i < a.length - 1; i++) {
      aBigrams.add(a.substring(i, i + 2))
    }
    
    let matches = 0
    for (let i = 0; i < b.length - 1; i++) {
      const bigram = b.substring(i, i + 2)
      if (aBigrams.has(bigram)) {
        matches++
        aBigrams.delete(bigram)
      }
    }
    
    return (2.0 * matches) / (a.length + b.length - 2)
  }

  async processRecording(
    audioPath: string,
    transcriptPath: string,
    participantRoster: Map<string, any>,
    expectedSpeakers?: number,
    meetingStartTime?: number,
    speakerChangeLog?: Array<{ timestamp: number; speaker: string; isoTimestamp: string }>
  ): Promise<void> {
    try {
      console.log('Starting Assembly.ai batch processing for speaker diarization...')
      console.log(`Audio file: ${audioPath}`)
      console.log(`Expected speakers: ${expectedSpeakers || 'auto-detect'}`)

      const startTime = Date.now()
      const transcript = await this.client.transcripts.transcribe({
        audio: audioPath,
        speaker_labels: true,
        speakers_expected: expectedSpeakers,
      })

      const processingTime = Math.round((Date.now() - startTime) / 1000)
      console.log(`Assembly.ai processing completed in ${processingTime}s`)

      if (transcript.status === 'error') {
        throw new Error(`Assembly.ai transcription failed: ${transcript.error}`)
      }

      if (!transcript.utterances || transcript.utterances.length === 0) {
        console.log('No utterances found in Assembly.ai response')
        return
      }

      console.log(`Received ${transcript.utterances.length} utterances from Assembly.ai`)

      // Use Assembly.ai's speaker diarization and map to participant names
      console.log(`\n=== AUDIO-BASED SPEAKER DIARIZATION ===`)
      console.log(`Assembly.ai detected ${new Set(transcript.utterances.map((u: any) => u.speaker)).size} unique speakers`)
      console.log(`Participant roster has ${participantRoster.size} participants`)

      const speakerMapping = await this.mapSpeakersToNamesUsingAudio(
        transcript.utterances,
        participantRoster
      )

      // DEBUG: Show what Assembly.ai detected vs what we're mapping to
      console.log(`\n=== ASSEMBLY.AI SPEAKER MAPPING ===`)
      Object.entries(speakerMapping).forEach(([assemblyaiSpeaker, participantName]) => {
        const count = (transcript.utterances || []).filter((u: any) => u.speaker === assemblyaiSpeaker).length
        console.log(`  Speaker ${assemblyaiSpeaker} → "${participantName}" (${count} utterances)`)
      })
      console.log(`=========================================\n`)
      
      // Apply speaker mapping to utterances
      const utterancesWithMappedSpeakers = transcript.utterances.map((utt: any) => ({
        ...utt,
        speaker: speakerMapping[utt.speaker] || utt.speaker,
        original_speaker: utt.speaker
      }))
      
      // Filter hallucinations and short initial utterances
      const filteredUtterances = utterancesWithMappedSpeakers
        .map((utt: any) => {
          const text = utt.text.trim()
          const duration = utt.end - utt.start
          
          // Remove "SA" prefix variants
          const saPatterns = [/^SA\s+/i, /^S\.A\.\s*/i, /^SA,\s*/i, /^SA\.\s*/i]
          let cleanedText = text
          
          for (const pattern of saPatterns) {
            if (pattern.test(cleanedText)) {
              console.log(`Cleaned SA prefix: "${cleanedText.substring(0, 40)}..."`)
              cleanedText = cleanedText.replace(pattern, '').trim()
              break
            }
          }
          
          return {
            ...utt,
            text: cleanedText,
            original_text: text
          }
        })
        .filter((utt: any) => {
          const text = utt.text.trim()
          const lowerText = text.toLowerCase()
          const duration = utt.end - utt.start
          
          // Remove automated placeholders (from Google Meet audio issues)
          const automatedPhrases = [
            'thank you',
            'thank you for watching',
            'thanks for watching',
            'i don\'t know what to say',
            'i don\'t know',
            'i do not know what to say'
          ]
          
          if (automatedPhrases.includes(lowerText) && utt.start < 30000) {
            console.log(`Filtered automated: "${text}"`)
            return false
          }
          
          // Skip hallucinations
          const hallucinations = [
            '', 'SA', 'SA Foreign', 'SA Foreign.', 'Foreign', 'Foreign.',
            'foreign', 'foreign.', 'S.A.', 'S.A. Foreign', 'S.A. Foreign.'
          ]
          if (hallucinations.includes(text)) {
            console.log(`Filtered hallucination: "${utt.original_text || text}"`)
            return false
          }
          
          // Skip short utterances at meeting start
          if (utt.start < 15000 && duration < 1000 && text.length < 15) {
            console.log(`Filtered short noise: "${text}" (${duration}ms)`)
            return false
          }
          
          // Skip single short words with very short duration (noise)
          const wordCount = text.split(/\s+/).length
          if (wordCount === 1 && text.length < 5 && duration < 500) {
            const meaningful = ['yes', 'no', 'okay', 'sure', 'right', 'good', 'great', 'nice']
            if (!meaningful.includes(lowerText)) {
              console.log(`Filtered noise word: "${text}"`)
              return false
            }
          }
          
          return true
        })
      
      // Deduplicate similar consecutive utterances from the same speaker
      const deduplicatedUtterances = []
      for (let i = 0; i < filteredUtterances.length; i++) {
        const current = filteredUtterances[i]
        
        if (i === 0) {
          deduplicatedUtterances.push(current)
          continue
        }
        
        const previous = deduplicatedUtterances[deduplicatedUtterances.length - 1]
        const timeDiff = current.start - previous.end
        
        // Check for duplicates from same speaker within 10 seconds
        if (current.speaker === previous.speaker && timeDiff < 10000) {
          const similarity = this.calculateSimilarity(current.text, previous.text)
          
          if (similarity >= 0.75) {
            // Keep longer version
            if (current.text.length > previous.text.length * 1.2) {
              console.log(`Replaced with longer version (${previous.text.length} -> ${current.text.length} chars)`)
              deduplicatedUtterances[deduplicatedUtterances.length - 1] = current
              continue
            } else {
              console.log(`Filtered duplicate (${(similarity * 100).toFixed(0)}% similar)`)
              continue
            }
          }
        }
        
        deduplicatedUtterances.push(current)
      }
      
      const finalFilteredUtterances = deduplicatedUtterances
      
      console.log(`✅ Filtered ${utterancesWithMappedSpeakers.length - finalFilteredUtterances.length} items (hallucinations/noise/duplicates)`)
      console.log(`Final utterances: ${finalFilteredUtterances.length}`)

      const correctedTranscript = await this.generateCorrectedTranscript(
        finalFilteredUtterances,
        speakerMapping, // Pass the mapping so report knows we used audio-based diarization
        transcriptPath,
        meetingStartTime || Date.now()
      )

      // Save corrected transcript as the main transcript
      await writeFile(transcriptPath, correctedTranscript)
      console.log(`Corrected transcript saved as main transcript: ${transcriptPath}`)

      // Generate and save transcript with speaker labels
      const transcriptWithLabels = await this.generateTranscriptWithSpeakerLabels(
        finalFilteredUtterances,
        speakerMapping,
        meetingStartTime || Date.now()
      )
      const labelsPath = transcriptPath.replace('.log', '_with_speaker_labels.log')
      await writeFile(labelsPath, transcriptWithLabels)
      console.log(`Transcript with speaker labels saved: ${labelsPath}`)

      // Generate and save transcript with only speaker labels (no names)
      const transcriptLabelsOnly = await this.generateTranscriptWithLabelsOnly(
        finalFilteredUtterances,
        speakerMapping,
        meetingStartTime || Date.now()
      )
      const labelsOnlyPath = transcriptPath.replace('.log', '_speaker_labels_only.log')
      await writeFile(labelsOnlyPath, transcriptLabelsOnly)
      console.log(`Transcript with speaker labels only saved: ${labelsOnlyPath}`)

      const report = this.generateSpeakerReport(
        finalFilteredUtterances,
        speakerMapping, // Pass the mapping so report knows we used audio-based diarization
        transcriptPath,
        participantRoster
      )
      const reportPath = transcriptPath.replace('.log', '_speaker_report.txt')
      await writeFile(reportPath, report)
      console.log(`Speaker report saved: ${reportPath}`)

    } catch (error) {
      console.error('Error in Assembly.ai post-processing:', error instanceof Error ? error.message : error)
      throw error
    }
  }

  /**
   * Map Assembly.ai speakers to participant names using audio-based heuristics
   */
  private async mapSpeakersToNamesUsingAudio(
    utterances: any[],
    participantRoster: Map<string, any>
  ): Promise<SpeakerMapping> {
    console.log(`\n=== SMART AUDIO-BASED SPEAKER MAPPING ===`)
    
    // Get unique Assembly.ai speakers
    const assemblyaiSpeakers = [...new Set(utterances.map((u: any) => u.speaker))].sort()
    console.log(`Assembly.ai detected speakers: ${assemblyaiSpeakers.join(', ')}`)
    
    // Get participant names from roster, filtered by activity
    const allParticipants = Array.from(participantRoster.keys())
      .filter(name => {
        if (!name) return false
        if (name === 'Unknown' || name === 'User') return false
        // Filter out generic "Unknown Speaker" labels - we only want real participant names
        if (name.startsWith('Unknown Speaker')) {
          console.log(`  🚫 Filtering out generic label: "${name}"`)
          return false
        }
        return true
      })
    
    console.log(`\nReal participants in roster: ${allParticipants.length}`)
    if (allParticipants.length === 0) {
      console.log(`\n❌ CRITICAL: No real participant names detected!`)
      console.log(`This means Google Meet couldn't identify anyone:`)
      console.log(`  - Participants may not have cameras on`)
      console.log(`  - Participant list may not have been visible to the bot`)
      console.log(`  - Bot may have joined before other participants`)
      console.log(`\nRecommendations:`)
      console.log(`  1. Ensure participant list is visible/expanded in Google Meet`)
      console.log(`  2. Have participants turn on cameras when joining`)
      console.log(`  3. Have bot join after participants are already in the meeting`)
      console.log(`  4. Consider integrating calendar invite parsing for attendee names`)
      console.log(`\n⚠️ Falling back to Assembly.ai speaker labels only (A, B, C, etc.)`)
    } else {
      allParticipants.forEach(name => {
        const activity = participantRoster.get(name)?.activityCount || 0
        console.log(`  - ${name}: activity = ${activity}`)
      })
    }
    
    // Filter out participants with zero activity (muted/silent participants)
    const participantNames = allParticipants
      .filter(name => {
        const activity = participantRoster.get(name)?.activityCount || 0
        if (activity === 0) {
          console.log(`  ⚠️ Excluding ${name} (zero activity - likely muted/silent)`)
          return false
        }
        return true
      })
      .sort((a, b) => {
        const aActivity = participantRoster.get(a)?.activityCount || 0
        const bActivity = participantRoster.get(b)?.activityCount || 0
        return bActivity - aActivity // Descending - most active first
      })
    
    console.log(`\nActive participants (by activity): ${participantNames.map(n => `${n} (${participantRoster.get(n)?.activityCount || 0})`).join(', ')}`)
    
    // Calculate speaking statistics for each Assembly.ai speaker
    const speakerStats = new Map<string, {
      utteranceCount: number
      totalDuration: number
      avgDuration: number
      firstUtteranceTime: number
      lastUtteranceTime: number
    }>()
    
    assemblyaiSpeakers.forEach(speaker => {
      const speakerUtterances = utterances.filter((u: any) => u.speaker === speaker)
      const totalDuration = speakerUtterances.reduce((sum: number, u: any) => sum + (u.end - u.start), 0)
      const avgDuration = totalDuration / speakerUtterances.length
      
      speakerStats.set(speaker, {
        utteranceCount: speakerUtterances.length,
        totalDuration,
        avgDuration,
        firstUtteranceTime: speakerUtterances[0].start,
        lastUtteranceTime: speakerUtterances[speakerUtterances.length - 1].end
      })
      
      console.log(`\nSpeaker ${speaker}:`)
      console.log(`  Utterances: ${speakerUtterances.length}`)
      console.log(`  Total duration: ${(totalDuration / 1000).toFixed(1)}s`)
      console.log(`  Avg duration: ${(avgDuration / 1000).toFixed(1)}s`)
      console.log(`  First spoke at: ${(speakerStats.get(speaker)!.firstUtteranceTime / 1000).toFixed(1)}s`)
    })
    
    // Sort Assembly.ai speakers by speaking order (who spoke first)
    const speakersByOrder = [...assemblyaiSpeakers].sort((a, b) => {
      const aTime = speakerStats.get(a)!.firstUtteranceTime
      const bTime = speakerStats.get(b)!.firstUtteranceTime
      return aTime - bTime
    })
    
    console.log(`\nSpeaking order: ${speakersByOrder.join(' → ')}`)
    
    // Extract names mentioned in transcript for intelligent matching
    const allTranscriptText = utterances.map((u: any) => u.text).join(' ').toLowerCase()
    const nameMentions = new Map<string, number>()
    
    participantNames.forEach(name => {
      const nameLower = name.toLowerCase()
      const firstName = nameLower.split(' ')[0]
      const lastName = nameLower.split(' ').slice(-1)[0]
      
      // Count how many times each name/variant is mentioned
      let mentions = 0
      mentions += (allTranscriptText.match(new RegExp(nameLower, 'g')) || []).length
      if (firstName && firstName.length > 2) {
        mentions += (allTranscriptText.match(new RegExp(`\\b${firstName}\\b`, 'g')) || []).length
      }
      if (lastName && lastName.length > 2 && lastName !== firstName) {
        mentions += (allTranscriptText.match(new RegExp(`\\b${lastName}\\b`, 'g')) || []).length
      }
      
      if (mentions > 0) {
        nameMentions.set(name, mentions)
        console.log(`📝 "${name}" mentioned ${mentions} time(s) in transcript`)
      }
    })
    
    // Create mapping
    const mapping: SpeakerMapping = {}
    
    // Strategy 1: If same number of speakers, use intelligent matching
    if (assemblyaiSpeakers.length === participantNames.length) {
      console.log(`\n✅ Strategy: Same number of speakers - using CONTEXTUAL name mention matching`)
      
      // Build a scoring system for each speaker → participant mapping
      const mappingScores = new Map<string, Map<string, {
        contextualMentions: number  // Name mentioned right before this speaker talks
        adjacentMentions: number     // Name mentioned in nearby utterances (2-4 after)
      }>>()
      
      assemblyaiSpeakers.forEach(speaker => {
        const participantScores = new Map<string, { contextualMentions: number; adjacentMentions: number }>()
        
        participantNames.forEach(participant => {
          participantScores.set(participant, {
            contextualMentions: 0,
            adjacentMentions: 0
          })
        })
        
        mappingScores.set(speaker, participantScores)
      })
      
      // Analyze contextual name mentions for each utterance
      utterances.forEach((utterance: any, index: number) => {
        const speaker = utterance.speaker
        const text = utterance.text.toLowerCase()
        
        // Check if any participant names are mentioned in this utterance
        participantNames.forEach(participant => {
          const firstName = participant.split(' ')[0].toLowerCase()
          const lastName = participant.split(' ').slice(-1)[0].toLowerCase()
          
          // Create patterns for name matching
          const namePatterns = [
            new RegExp(`\\b${firstName}\\b`, 'i'),
            firstName.length > 3 ? new RegExp(`\\b${firstName.substring(0, firstName.length - 1)}`, 'i') : null, // Handle nicknames
          ].filter(Boolean) as RegExp[]
          
          const nameIsMentioned = namePatterns.some(pattern => pattern.test(text))
          
          if (nameIsMentioned) {
            // CRITICAL: Do NOT give points to the speaker who SAID the name
            // If someone says "Hey Louie", that person is NOT Louie!
            
            // Strong signal: Name mentioned, check who speaks NEXT
            if (index + 1 < utterances.length) {
              const nextSpeaker = utterances[index + 1].speaker
              const scores = mappingScores.get(nextSpeaker)?.get(participant)
              if (scores && nextSpeaker !== speaker) { // Don't map to person who said the name
                scores.contextualMentions += 10 // INCREASED: Very strong signal
                console.log(`    🎯 "${firstName}" mentioned by ${speaker} → next speaker ${nextSpeaker} (strong signal!)`)
              }
            }
            
            // Medium signal: Name mentioned, check who speaks in next 2-3 utterances
            // (in case there's a brief interruption like "Yeah" or "Okay")
            for (let offset = 2; offset <= 4; offset++) {
              const nearbyIndex = index + offset
              if (nearbyIndex < utterances.length) {
                const nearbySpeaker = utterances[nearbyIndex].speaker
                const scores = mappingScores.get(nearbySpeaker)?.get(participant)
                if (scores && nearbySpeaker !== speaker) { // Don't map to person who said the name
                  scores.adjacentMentions += 1 // Lower weight for non-immediate followers
                }
              }
            }
          }
        })
      })
      
      // Greedy assignment: Assign speakers to participants with highest scores
      const unmappedSpeakers = new Set(assemblyaiSpeakers)
      const unmappedParticipants = new Set(participantNames)
      
      console.log(`\n📊 Contextual Name Mention Scores:`)
      
      // Sort speakers by total speaking time (prioritize dominant speakers for first assignments)
      const speakersByDuration = [...assemblyaiSpeakers].sort((a, b) => {
        const aDuration = speakerStats.get(a)!.totalDuration
        const bDuration = speakerStats.get(b)!.totalDuration
        return bDuration - aDuration
      })
      
      // First pass: Assign speakers with strong contextual signals
      speakersByDuration.forEach(speaker => {
        if (!unmappedSpeakers.has(speaker)) return
        
        let bestParticipant: string | null = null
        let bestScore = 0
        
        const participantScores = mappingScores.get(speaker)!
        
        for (const [participant, scores] of participantScores.entries()) {
          if (!unmappedParticipants.has(participant)) continue
          
          // Weighted scoring: contextual mentions (weight 10) >> adjacent mentions (weight 1)
          const totalScore = scores.contextualMentions + scores.adjacentMentions
          
          if (totalScore > bestScore) {
            bestScore = totalScore
            bestParticipant = participant
          }
        }
        
        if (bestParticipant && bestScore >= 5) { // Threshold: need at least one contextual mention (score 10) or 5+ adjacent
          const scores = participantScores.get(bestParticipant)!
          mapping[speaker] = bestParticipant
          unmappedSpeakers.delete(speaker)
          unmappedParticipants.delete(bestParticipant)
          console.log(`  ✅ ${speaker} → ${bestParticipant} (score: ${bestScore}, contextual: ${scores.contextualMentions}, adjacent: ${scores.adjacentMentions})`)
        }
      })
      
      // Second pass: Map remaining speakers by activity level + speaking duration
      const remainingSpeakers = [...unmappedSpeakers].sort((a, b) => {
        const aDuration = speakerStats.get(a)!.totalDuration
        const bDuration = speakerStats.get(b)!.totalDuration
        return bDuration - aDuration
      })
      
      const remainingParticipants = [...unmappedParticipants].sort((a, b) => {
        const aActivity = participantRoster.get(a)?.activityCount || 0
        const bActivity = participantRoster.get(b)?.activityCount || 0
        return bActivity - aActivity
      })
      
      console.log(`\n⚠️ ${remainingSpeakers.length} speaker(s) without strong name mention signals - mapping by speaking duration vs activity:`)
      
      remainingSpeakers.forEach((speaker, index) => {
        if (index < remainingParticipants.length) {
          const participant = remainingParticipants[index]
          mapping[speaker] = participant
          const duration = speakerStats.get(speaker)!.totalDuration / 1000
          const activity = participantRoster.get(participant)?.activityCount || 0
          console.log(`  ${speaker} → ${participant} (${duration.toFixed(1)}s speaking, activity: ${activity})`)
        }
      })
    }
    // Strategy 2: If Assembly.ai detected more speakers (over-segmentation)
    else if (assemblyaiSpeakers.length > participantNames.length) {
      console.log(`\n⚠️ Strategy: Over-segmentation detected (${assemblyaiSpeakers.length} > ${participantNames.length})`)
      console.log(`Analyzing speakers to detect meeting pattern...`)
      
      // Calculate total speaking duration
      const totalDuration = Array.from(speakerStats.values()).reduce((sum, stat) => sum + stat.totalDuration, 0)
      
      // Sort Assembly.ai speakers by total speaking time
      const speakersByDuration = [...assemblyaiSpeakers].sort((a, b) => {
        const aDuration = speakerStats.get(a)!.totalDuration
        const bDuration = speakerStats.get(b)!.totalDuration
        return bDuration - aDuration
      })
      
      // Analyze temporal clustering for each speaker
      const temporalAnalysis = new Map<string, {
        isTemporallyGrouped: boolean
        avgGapBetweenUtterances: number
        maxGapBetweenUtterances: number
        speakingSpanDuration: number
      }>()
      
      assemblyaiSpeakers.forEach(speaker => {
        const speakerUtterances = utterances
          .filter((u: any) => u.speaker === speaker)
          .sort((a: any, b: any) => a.start - b.start)
        
        if (speakerUtterances.length < 2) {
          temporalAnalysis.set(speaker, {
            isTemporallyGrouped: false,
            avgGapBetweenUtterances: 0,
            maxGapBetweenUtterances: 0,
            speakingSpanDuration: 0
          })
          return
        }
        
        // Calculate gaps between consecutive utterances
        const gaps: number[] = []
        for (let i = 1; i < speakerUtterances.length; i++) {
          const gap = speakerUtterances[i].start - speakerUtterances[i - 1].end
          gaps.push(gap)
        }
        
        const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
        const maxGap = Math.max(...gaps)
        const speakingSpan = speakerUtterances[speakerUtterances.length - 1].end - speakerUtterances[0].start
        
        // A speaker is temporally grouped if:
        // - Their utterances span a relatively short time window compared to total meeting
        // - OR their utterances don't have huge gaps (suggesting they spoke in one continuous segment)
        const isTemporallyGrouped = (
          speakingSpan < totalDuration * 0.3 || // Spoke within 30% of meeting duration
          maxGap < 60000 // Max gap < 60 seconds
        )
        
        temporalAnalysis.set(speaker, {
          isTemporallyGrouped,
          avgGapBetweenUtterances: avgGap,
          maxGapBetweenUtterances: maxGap,
          speakingSpanDuration: speakingSpan
        })
        
        console.log(`  ${speaker}: ${speakerUtterances.length} utterances, span=${(speakingSpan/1000).toFixed(0)}s, maxGap=${(maxGap/1000).toFixed(0)}s → ${isTemporallyGrouped ? 'GROUPED' : 'DISTRIBUTED'}`)
      })
      
      // Classify speakers as real speakers vs over-segmentation artifacts
      const realSpeakers: string[] = []
      const oversegmentedSpeakers: string[] = []
      
      // Calculate cumulative duration to detect if top N speakers account for most speech
      let cumulativeDuration = 0
      const cumulativePercentages: number[] = []
      
      speakersByDuration.forEach(speaker => {
        const stats = speakerStats.get(speaker)!
        cumulativeDuration += stats.totalDuration
        cumulativePercentages.push((cumulativeDuration / totalDuration) * 100)
      })
      
      speakersByDuration.forEach((speaker, index) => {
        const stats = speakerStats.get(speaker)!
        const temporal = temporalAnalysis.get(speaker)!
        const percentage = (stats.totalDuration / totalDuration) * 100
        const cumulativePercentage = cumulativePercentages[index]
        
        // A speaker is considered REAL if they meet ANY of these criteria:
        // 1. They spoke for >15% of the meeting (significant speaker regardless of pattern)
        // 2. They have 10+ utterances (definitely a real speaker)
        // 3. They have 5+ utterances AND temporally grouped (stand-up meeting pattern)
        // 4. They're in top N speakers AND top N accounts for >70% of speech (normal conversation)
        const isTopSpeakerInConversation = (
          index < participantNames.length &&
          cumulativePercentage <= 85 && // Top N speakers don't dominate beyond reasonable amount
          percentage >= 10 // Each must have at least 10% contribution
        )
        
        const isRealSpeaker = (
          percentage >= 15 ||
          stats.utteranceCount >= 10 ||
          (stats.utteranceCount >= 5 && temporal.isTemporallyGrouped) ||
          isTopSpeakerInConversation
        )
        
        if (isRealSpeaker) {
          realSpeakers.push(speaker)
          console.log(`  ✅ ${speaker}: ${stats.utteranceCount} utterances, ${percentage.toFixed(1)}% duration → REAL SPEAKER`)
        } else {
          oversegmentedSpeakers.push(speaker)
          console.log(`  🔄 ${speaker}: ${stats.utteranceCount} utterances, ${percentage.toFixed(1)}% duration → OVER-SEGMENTATION`)
        }
      })
      
      console.log(`\n📊 Analysis: ${realSpeakers.length} real speakers, ${oversegmentedSpeakers.length} over-segmented speakers`)
      
      // Use contextual name mention analysis to map real speakers to participants
      console.log(`\n🎯 Using CONTEXTUAL name mention matching for real speakers:`)
      
      const mappingScores = new Map<string, Map<string, number>>()
      
      // Analyze contextual name mentions
      realSpeakers.forEach(speaker => {
        const participantScores = new Map<string, number>()
        
        participantNames.forEach(participant => {
          const firstName = participant.split(' ')[0].toLowerCase()
          let score = 0
          
          // Find all utterances where this participant's name is mentioned
          utterances.forEach((utterance: any, globalIndex: number) => {
            const text = utterance.text.toLowerCase()
            const mentioningSpeaker = utterance.speaker
            
            // CRITICAL: Don't give points if this speaker SAID the name
            // If Speaker A says "Hey Louie", Speaker A is NOT Louie!
            if (mentioningSpeaker === speaker) {
              return // Skip - person doesn't mention their own name in greetings
            }
            
            if (new RegExp(`\\b${firstName}\\b`, 'i').test(text)) {
              // Check if our speaker talks right after this name mention
              if (globalIndex + 1 < utterances.length) {
                const nextSpeaker = utterances[globalIndex + 1].speaker
                if (nextSpeaker === speaker) {
                  score += 10 // Very strong: "Hey [Name]" → person speaks next
                }
              }
              
              // Check if our speaker talks within next 2-4 utterances (handling brief interruptions)
              for (let offset = 2; offset <= 4; offset++) {
                if (globalIndex + offset < utterances.length) {
                  const nearbySpeaker = utterances[globalIndex + offset].speaker
                  if (nearbySpeaker === speaker) {
                    score += 2 // Medium: name mentioned → person speaks soon after
                    break // Only count once per mention
                  }
                }
              }
            }
          })
          
          participantScores.set(participant, score)
        })
        
        mappingScores.set(speaker, participantScores)
      })
      
      // Greedy assignment: match speakers to participants with highest scores
      const unmappedRealSpeakers: string[] = []
      const unmappedParticipants = new Set(participantNames)
      const mappedSpeakers: string[] = []
      
      // Sort real speakers by total score (prioritize those with strong name signals)
      const realSpeakersByScore = [...realSpeakers].sort((a, b) => {
        const aMaxScore = Math.max(...Array.from(mappingScores.get(a)!.values()))
        const bMaxScore = Math.max(...Array.from(mappingScores.get(b)!.values()))
        return bMaxScore - aMaxScore
      })
      
      realSpeakersByScore.forEach(speaker => {
        const participantScores = mappingScores.get(speaker)!
        let bestParticipant: string | null = null
        let bestScore = 0
        
        for (const [participant, score] of participantScores.entries()) {
          if (unmappedParticipants.has(participant) && score > bestScore) {
            bestScore = score
            bestParticipant = participant
          }
        }
        
        if (bestParticipant && bestScore >= 5) {
          // Confident match based on name mentions
          mapping[speaker] = bestParticipant
          unmappedParticipants.delete(bestParticipant)
          mappedSpeakers.push(speaker)
          const stats = speakerStats.get(speaker)!
          console.log(`  ✅ ${speaker} → ${bestParticipant} (name mention score: ${bestScore}, ${stats.utteranceCount} utterances)`)
        } else {
          unmappedRealSpeakers.push(speaker)
        }
      })
      
      // Map remaining real speakers by speaking duration vs participant activity
      if (unmappedRealSpeakers.length > 0 && unmappedParticipants.size > 0) {
        console.log(`\n⚠️ ${unmappedRealSpeakers.length} real speaker(s) without name mentions - mapping by duration:`)
        
        const sortedUnmappedSpeakers = unmappedRealSpeakers.sort((a, b) => {
          const aDuration = speakerStats.get(a)!.totalDuration
          const bDuration = speakerStats.get(b)!.totalDuration
          return bDuration - aDuration
        })
        
        const sortedUnmappedParticipants = Array.from(unmappedParticipants).sort((a, b) => {
          const aActivity = participantRoster.get(a)?.activityCount || 0
          const bActivity = participantRoster.get(b)?.activityCount || 0
          return bActivity - aActivity
        })
        
        sortedUnmappedSpeakers.forEach((speaker, index) => {
          if (index < sortedUnmappedParticipants.length) {
            const participant = sortedUnmappedParticipants[index]
            mapping[speaker] = participant
            unmappedParticipants.delete(participant)
            mappedSpeakers.push(speaker)
            const stats = speakerStats.get(speaker)!
            console.log(`  ${speaker} → ${participant} (${stats.utteranceCount} utterances, duration-based)`)
          }
        })
        
        // Update unmappedRealSpeakers to only include truly unmapped ones
        unmappedRealSpeakers.length = 0
        realSpeakers.forEach(s => {
          if (!mapping[s]) unmappedRealSpeakers.push(s)
        })
      }
      
      // Handle unmapped real speakers (more speakers detected than participants available)
      // Instead of creating generic labels, consolidate them into the most similar mapped speaker
      if (unmappedRealSpeakers.length > 0) {
        console.log(`\n⚠️ ${unmappedRealSpeakers.length} real speaker(s) exceed available participants`)
        console.log(`⚠️ This happens when people spoke but weren't captured visually (no camera, not in visible tiles, etc.)`)
        console.log(`Strategy: Consolidating unmapped speakers into most similar mapped speakers based on timing:`)
        
        unmappedRealSpeakers.forEach((unmappedSpeaker) => {
          const unmappedStats = speakerStats.get(unmappedSpeaker)!
          const unmappedUtterances = utterances.filter((u: any) => u.speaker === unmappedSpeaker)
          
          if (mappedSpeakers.length > 0) {
            // Find closest mapped speaker by timing and voice pattern similarity
            let closestSpeaker = mappedSpeakers[0]
            let minTimeDiff = Infinity
            
            unmappedUtterances.forEach((unmappedUtt: any) => {
              mappedSpeakers.forEach(mappedSpeaker => {
                const mappedUtterances = utterances.filter((u: any) => u.speaker === mappedSpeaker)
                
                mappedUtterances.forEach((mappedUtt: any) => {
                  const timeDiff = Math.abs(unmappedUtt.start - mappedUtt.start)
                  if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff
                    closestSpeaker = mappedSpeaker
                  }
                })
              })
            })
            
            const consolidatedTo = mapping[closestSpeaker]
            mapping[unmappedSpeaker] = consolidatedTo
            mappedSpeakers.push(unmappedSpeaker) // Add to mapped speakers for future consolidations
            console.log(`  ${unmappedSpeaker} (${unmappedStats.utteranceCount} utterances, ${(unmappedStats.totalDuration / 1000).toFixed(1)}s) → ${consolidatedTo} (via ${closestSpeaker}, ${(minTimeDiff/1000).toFixed(1)}s apart)`)
          } else {
            // If no mapped speakers exist, use first participant from roster as fallback
            const fallbackParticipant = participantNames[0] || 'Speaker'
            mapping[unmappedSpeaker] = fallbackParticipant
            mappedSpeakers.push(unmappedSpeaker)
            console.log(`  ${unmappedSpeaker} → ${fallbackParticipant} (no other mapped speakers, using roster fallback)`)
          }
        })
        
        console.log(`\n💡 TIP: To improve accuracy, ensure:`)
        console.log(`   1. Bot joins after most participants have joined`)
        console.log(`   2. Participants have cameras on or are in participant list`)
        console.log(`   3. Consider implementing calendar invite scraping for attendee names`)
      }
      
      // Consolidate over-segmentation artifacts into their nearest real speaker
      if (oversegmentedSpeakers.length > 0 && mappedSpeakers.length > 0) {
        console.log(`\n🔄 Consolidating ${oversegmentedSpeakers.length} over-segmented speaker(s):`)
        
        oversegmentedSpeakers.forEach(overSegSpeaker => {
          const overSegStats = speakerStats.get(overSegSpeaker)!
          const overSegUtterances = utterances.filter((u: any) => u.speaker === overSegSpeaker)
          
          let closestSpeaker = mappedSpeakers[0]
          let minTimeDiff = Infinity
          
          overSegUtterances.forEach((overSegUtt: any) => {
            mappedSpeakers.forEach(mappedSpeaker => {
              const mappedUtterances = utterances.filter((u: any) => u.speaker === mappedSpeaker)
              
              mappedUtterances.forEach((mappedUtt: any) => {
                const timeDiff = Math.abs(overSegUtt.start - mappedUtt.start)
                if (timeDiff < minTimeDiff) {
                  minTimeDiff = timeDiff
                  closestSpeaker = mappedSpeaker
                }
              })
            })
          })
          
          const consolidatedTo = mapping[closestSpeaker]
          mapping[overSegSpeaker] = consolidatedTo
          console.log(`  ${overSegSpeaker} (${overSegStats.utteranceCount} utterances, ${(overSegStats.totalDuration / 1000).toFixed(1)}s) → ${consolidatedTo} (via ${closestSpeaker}, ${(minTimeDiff/1000).toFixed(1)}s apart)`)
        })
      }
      
      // Safety net: Ensure ALL Assembly.ai speakers are mapped
      // Any unmapped speakers get consolidated into nearest mapped speaker
      const unmappedSpeakers = assemblyaiSpeakers.filter(s => !mapping[s])
      if (unmappedSpeakers.length > 0) {
        console.log(`\n⚠️ WARNING: ${unmappedSpeakers.length} speaker(s) were not mapped in previous steps!`)
        console.log(`Consolidating into nearest mapped speakers:`)
        
        unmappedSpeakers.forEach(unmappedSpeaker => {
          const stats = speakerStats.get(unmappedSpeaker)!
          const unmappedUtterances = utterances.filter((u: any) => u.speaker === unmappedSpeaker)
          
          if (mappedSpeakers.length > 0) {
            // Find closest mapped speaker by timing
            let closestSpeaker = mappedSpeakers[0]
            let minTimeDiff = Infinity
            
            unmappedUtterances.forEach((unmappedUtt: any) => {
              mappedSpeakers.forEach(mappedSpeaker => {
                const mappedUtterances = utterances.filter((u: any) => u.speaker === mappedSpeaker)
                
                mappedUtterances.forEach((mappedUtt: any) => {
                  const timeDiff = Math.abs(unmappedUtt.start - mappedUtt.start)
                  if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff
                    closestSpeaker = mappedSpeaker
                  }
                })
              })
            })
            
            const consolidatedTo = mapping[closestSpeaker]
            mapping[unmappedSpeaker] = consolidatedTo
            console.log(`  ${unmappedSpeaker} (${stats.utteranceCount} utterances, ${(stats.totalDuration / 1000).toFixed(1)}s) → ${consolidatedTo} (via ${closestSpeaker})`)
          } else {
            // No mapped speakers available - use first participant from roster as fallback
            const fallbackParticipant = participantNames[0] || 'Speaker'
            mapping[unmappedSpeaker] = fallbackParticipant
            console.log(`  ${unmappedSpeaker} → ${fallbackParticipant} (no other mapped speakers, using roster fallback)`)
          }
        })
      }
    }
    // Strategy 3: If Assembly.ai detected fewer speakers
    else {
      console.log(`\n⚠️ Strategy: Under-detection (${assemblyaiSpeakers.length} < ${participantNames.length})`)
      console.log(`Mapping detected speakers to most active participants`)
      
      // Sort participants by activity if available
      const sortedParticipants = [...participantNames].sort((a, b) => {
        const aParticipant = participantRoster.get(a)
        const bParticipant = participantRoster.get(b)
        const aActivity = aParticipant?.activityCount || 0
        const bActivity = bParticipant?.activityCount || 0
        return bActivity - aActivity // Descending
      })
      
      speakersByOrder.forEach((speaker, index) => {
        if (index < sortedParticipants.length) {
          mapping[speaker] = sortedParticipants[index]
          console.log(`  ${speaker} → ${sortedParticipants[index]}`)
        }
      })
    }
    
    console.log(`\n=== FINAL MAPPING ===`)
    Object.entries(mapping).forEach(([speaker, name]) => {
      console.log(`  ${speaker} → "${name}"`)
    })
    console.log(`=====================\n`)
    
    // Sanity check: warn if any mapped names aren't in the roster
    const mappedNames = new Set(Object.values(mapping))
    const rosterNames = new Set(Array.from(participantRoster.keys()))
    
    mappedNames.forEach(name => {
      if (!rosterNames.has(name)) {
        console.warn(`⚠️ WARNING: "${name}" was mapped but not in roster`)
        console.warn(`   Roster: ${Array.from(rosterNames).join(', ')}`)
      }
    })
    
    return mapping
  }

  /**
   * DEPRECATED: Map utterances to speaker timeline (visual detection approach)
   */
  private async mapUtterancesToSpeakerTimeline(
    utterances: any[],
    speakerTimelinePath: string,
    meetingStartTime: number,
    participantRoster?: Map<string, any>
  ): Promise<any[]> {
    console.log(`\n=== SPEAKER TIMELINE MAPPING ===`)
    console.log(`Mapping ${utterances.length} utterances using speaker timeline`)
    console.log(`Timeline file: ${speakerTimelinePath}`)
    console.log(`Meeting start: ${new Date(meetingStartTime).toISOString()}`)
    
    // Read speaker timeline log
    let timelineEntries: Array<{ timestamp: number; speaker: string; isoTimestamp: string }> = []
    
    try {
      const { readFileSync } = await import('fs')
      const timelineContent = readFileSync(speakerTimelinePath, 'utf-8')
      const lines = timelineContent.split('\n').filter(line => line.trim())
      
      timelineEntries = lines.map(line => {
        // Parse format: [2025-11-04T06:02:11.116Z] User Speaking
        const match = line.match(/\[(.+?)\]\s+(.+)/)
        if (match) {
          const isoTimestamp = match[1]
          const speaker = match[2].trim()
          return {
            timestamp: new Date(isoTimestamp).getTime(),
            speaker,
            isoTimestamp
          }
        }
        return null
      }).filter(entry => entry !== null) as Array<{ timestamp: number; speaker: string; isoTimestamp: string }>
      
      console.log(`✅ Loaded ${timelineEntries.length} timeline entries`)
      if (timelineEntries.length > 0) {
        console.log(`   First entry: ${timelineEntries[0].isoTimestamp} - ${timelineEntries[0].speaker}`)
        console.log(`   Last entry: ${timelineEntries[timelineEntries.length - 1].isoTimestamp} - ${timelineEntries[timelineEntries.length - 1].speaker}`)
      }
    } catch (error) {
      console.error(`❌ Error reading speaker timeline: ${error}`)
      console.log(`⚠️ Falling back to "User" for all speakers`)
      // Return utterances with "User" as speaker
      return utterances.map(u => ({ ...u, speaker: 'User' }))
    }
    
    if (timelineEntries.length === 0) {
      console.log(`⚠️ No timeline entries found - using "User" as default`)
      return utterances.map(u => ({ ...u, speaker: 'User' }))
    }
    
    // Determine default speaker for edge cases
    let defaultSpeaker = 'User'
    if (timelineEntries.length > 0) {
      defaultSpeaker = timelineEntries[0].speaker
      console.log(`✅ Using first timeline speaker as default: ${defaultSpeaker}`)
    }
    
    // Map each utterance to the closest speaker in the timeline
    const mappedUtterances = utterances.map((utterance, index) => {
      const utteranceAbsoluteTime = meetingStartTime + utterance.start
      const utteranceTimestamp = new Date(utteranceAbsoluteTime).toISOString()
      
      // Find the closest timeline entry
      // Priority: Most recent entry before or at the utterance time
      let assignedSpeaker = defaultSpeaker
      let closestEntry = null
      let minTimeDiff = Infinity
      
      for (const entry of timelineEntries) {
        const timeDiff = Math.abs(entry.timestamp - utteranceAbsoluteTime)
        
        // Prefer entries before or at the utterance time
        if (entry.timestamp <= utteranceAbsoluteTime) {
          if (!closestEntry || entry.timestamp > closestEntry.timestamp) {
            closestEntry = entry
            assignedSpeaker = entry.speaker
          }
        } else if (timeDiff < minTimeDiff && timeDiff < 5000) {
          // Also consider entries up to 5 seconds after (for early utterances)
          minTimeDiff = timeDiff
          if (!closestEntry) {
            closestEntry = entry
            assignedSpeaker = entry.speaker
          }
        }
      }
      
      if (index < 3) {
        console.log(`\nUtterance ${index + 1}:`)
        console.log(`  Time: ${utteranceTimestamp}`)
        console.log(`  Relative time: ${utterance.start}ms from audio start`)
        console.log(`  Text: "${utterance.text.substring(0, 50)}..."`)
        console.log(`  Assembly.ai speaker: ${utterance.speaker}`)
        console.log(`  Timeline speaker: ${assignedSpeaker}`)
        if (closestEntry) {
          const timeDiff = Math.abs(closestEntry.timestamp - utteranceAbsoluteTime)
          console.log(`  Closest timeline entry: ${closestEntry.isoTimestamp} (${timeDiff}ms away)`)
        }
      }
      
      return {
        ...utterance,
        speaker: assignedSpeaker,
        original_speaker: utterance.speaker
      }
    })
    
    // Show statistics
    const speakerCounts = new Map<string, number>()
    mappedUtterances.forEach(u => {
      speakerCounts.set(u.speaker, (speakerCounts.get(u.speaker) || 0) + 1)
    })
    
    console.log(`\n✅ Mapping complete:`)
    speakerCounts.forEach((count, speaker) => {
      console.log(`  ${speaker}: ${count} utterances`)
    })
    console.log(`=================================\n`)
    
    return mappedUtterances
  }

  /**
   * DEPRECATED: Map utterances to visual speakers
   */
  private mapUtterancesToVisualSpeakers(
    utterances: any[],
    speakerChangeLog?: Array<{ timestamp: number; speaker: string; isoTimestamp: string }>,
    meetingStartTime: number = Date.now(),
    participantRoster?: Map<string, any>
  ): any[] {
    console.log(`\n=== VISUAL SPEAKER MAPPING ===`)
    console.log(`Mapping ${utterances.length} utterances to visual speakers`)
    console.log(`Speaker change log entries: ${speakerChangeLog?.length || 0}`)
    
    if (!speakerChangeLog || speakerChangeLog.length === 0) {
      console.log(`⚠️ No speaker change log - keeping Assembly.ai labels`)
      return utterances
    }
    
    // Determine the best default speaker for early utterances
    let defaultSpeaker = 'User'
    if (speakerChangeLog && speakerChangeLog.length > 0) {
      // Use the first speaker from the change log
      defaultSpeaker = speakerChangeLog[0].speaker
      console.log(`✅ Using first logged speaker as default: ${defaultSpeaker}`)
    } else if (participantRoster && participantRoster.size > 0) {
      // Fallback: Use first participant from roster
      const firstParticipant = Array.from(participantRoster.keys())[0]
      if (firstParticipant) {
        defaultSpeaker = firstParticipant
        console.log(`✅ Using first roster participant as default: ${defaultSpeaker}`)
      }
    }
    
    // Create a sorted list of speaker changes for efficient lookup
    const sortedChanges = [...speakerChangeLog].sort((a, b) => a.timestamp - b.timestamp)
    console.log(`Sorted speaker changes:`)
    sortedChanges.forEach((change, idx) => {
      if (idx < 5) {
        console.log(`  ${idx + 1}. ${change.isoTimestamp}: ${change.speaker}`)
      }
    })
    if (sortedChanges.length > 5) {
      console.log(`  ... and ${sortedChanges.length - 5} more`)
    }
    
    // Map each utterance to the speaker who was visually active at that time
    const mappedUtterances = utterances.map((utterance, index) => {
      const utteranceAbsoluteTime = meetingStartTime + utterance.start
      const utteranceTimestamp = new Date(utteranceAbsoluteTime).toISOString()
      
      // Find the most recent speaker change before or at this utterance time
      let assignedSpeaker = defaultSpeaker // Use intelligent default instead of 'User'
      
      for (let i = sortedChanges.length - 1; i >= 0; i--) {
        if (sortedChanges[i].timestamp <= utteranceAbsoluteTime) {
          assignedSpeaker = sortedChanges[i].speaker
          break
        }
      }
      
      // Also check if any speaker change is very close (within 5 seconds after for early utterances, 2 seconds otherwise)
      // This handles cases where visual detection is slightly delayed or Assembly.ai timing is off
      const isEarlyUtterance = utterance.start < 30000 // First 30 seconds of meeting
      const lookAheadWindow = isEarlyUtterance ? 5000 : 2000 // 5 seconds for early, 2 seconds otherwise
      
      for (const change of sortedChanges) {
        const timeDiff = change.timestamp - utteranceAbsoluteTime
        if (timeDiff > 0 && timeDiff < lookAheadWindow) {
          assignedSpeaker = change.speaker
          break
        }
      }
      
      // If still no match and it's an early utterance, use the first logged speaker
      if (assignedSpeaker === defaultSpeaker && isEarlyUtterance && sortedChanges.length > 0) {
        // For very early utterances (before first speaker change), use first speaker
        if (utteranceAbsoluteTime < sortedChanges[0].timestamp) {
          assignedSpeaker = sortedChanges[0].speaker
        }
      }
      
      if (index < 3) {
        console.log(`\nUtterance ${index + 1}:`)
        console.log(`  Time: ${utteranceTimestamp}`)
        console.log(`  Relative time: ${utterance.start}ms from audio start`)
        console.log(`  Text: "${utterance.text.substring(0, 50)}..."`)
        console.log(`  Assembly.ai speaker: ${utterance.speaker}`)
        console.log(`  Visual speaker: ${assignedSpeaker}`)
        console.log(`  Default speaker: ${defaultSpeaker}`)
        console.log(`  Is early utterance: ${isEarlyUtterance}`)
      }
      
      return {
        ...utterance,
        speaker: assignedSpeaker, // ✅ Override with visual detection
        original_speaker: utterance.speaker // Keep original for debugging
      }
    })
    
    // Show statistics
    const speakerCounts = new Map<string, number>()
    mappedUtterances.forEach(u => {
      speakerCounts.set(u.speaker, (speakerCounts.get(u.speaker) || 0) + 1)
    })
    
    console.log(`\n✅ Mapping complete:`)
    speakerCounts.forEach((count, speaker) => {
      console.log(`  ${speaker}: ${count} utterances`)
    })
    console.log(`=================================\n`)
    
    return mappedUtterances
  }

  private async mapSpeakersToNames(
    utterances: any[],
    participantRoster: Map<string, any>,
    meetingStartTime: number,
    speakerChangeLog?: Array<{ timestamp: number; speaker: string; isoTimestamp: string }>
  ): Promise<SpeakerMapping> {
    const speakerLabels = [...new Set(utterances.map(u => u.speaker))]
    let participantNames = Array.from(participantRoster.keys())
    
    console.log(`\n=== SPEAKER FILTERING ===`)
    console.log(`Raw participant names from roster (${participantNames.length}):`, participantNames)
    
    // Filter to only speakers who appear in change log
    if (speakerChangeLog && speakerChangeLog.length > 0) {
      const actualSpeakers = [...new Set(speakerChangeLog.map(log => log.speaker))]
        .filter(name => {
          if (!name) return false
          if (name === 'Unknown' || name === 'User') return false
          // Filter out generic labels - we only want real names
          if (name.startsWith('Unknown Speaker')) return false
          return true
        })
      
      console.log(`Real speakers from change log (${actualSpeakers.length}):`, actualSpeakers)
      
      if (actualSpeakers.length > 0) {
        console.log(`Using speakers from visual detection`)
        participantNames = actualSpeakers
      } else {
        console.log(`⚠️ Speaker change log exists but has no real names, using roster`)
      }
    } else {
      console.log(`⚠️ No speaker change log available, using all roster participants`)
    }
    
    // Deduplicate similar names
    const deduplicated = new Set<string>()
    const namesToRemove = new Set<string>()
    
    participantNames.forEach(name => {
      const nameClean = name.trim().toLowerCase()
      let isDuplicate = false
      
      for (const existing of deduplicated) {
        const existingClean = existing.trim().toLowerCase()
        
        if (nameClean.startsWith(existingClean) && nameClean !== existingClean) {
          console.log(`  ❌ Removing duplicate: "${name}" (shorter version "${existing}" exists)`)
          isDuplicate = true
          namesToRemove.add(name)
          break
        }
        if (existingClean.startsWith(nameClean) && nameClean !== existingClean) {
          console.log(`  🔄 Replacing "${existing}" with shorter version "${name}"`)
          deduplicated.delete(existing)
          namesToRemove.add(existing)
          break
        }
      }
      
      if (!isDuplicate) {
        deduplicated.add(name)
      }
    })
    
    participantNames = Array.from(deduplicated)
    console.log(`Final participant names after deduplication (${participantNames.length}):`, participantNames)
    console.log(`=================================\n`)

    console.log(`Mapping ${speakerLabels.length} speakers to ${participantNames.length} participants`)

    if (speakerLabels.length === 0) {
      console.log('⚠️ No speakers found in Assembly.ai response')
      return {}
    }

    if (participantNames.length === 0) {
      console.warn('⚠️ WARNING: No participants detected during meeting!')
      console.warn('This means visual speaker detection did not capture any participant names.')
      console.warn('Possible causes:')
      console.warn('  - Participant list was not visible/expanded in Google Meet')
      console.warn('  - Google Meet UI has changed')
      console.warn('  - Bot joined before other participants')
      console.warn('Attempting to extract names from transcript content...')
      
      const extractedNames = this.extractNamesFromTranscript(utterances)
      if (extractedNames.length > 0) {
        console.log(`Extracted ${extractedNames.length} potential names from transcript:`, extractedNames)
        
        const contentMapping = this.mapSpeakersByContent(utterances, extractedNames)
        
        // Validate the mapping - if it seems good, use it
        if (Object.keys(contentMapping).length > 0) {
          console.log(`✅ Successfully mapped ${Object.keys(contentMapping).length} speakers using transcript content`)
          return contentMapping
        }
      }
      
      // Try to extract names from speaker change log
      if (speakerChangeLog && speakerChangeLog.length > 0) {
        console.log('📝 Attempting to extract names from speaker change log...')
        const speakersFromLog = [...new Set(speakerChangeLog.map(log => log.speaker))]
          .filter(name => name && name !== 'Unknown' && name !== 'User' && name.length > 1)
        
        if (speakersFromLog.length > 0) {
          console.log(`✅ Extracted ${speakersFromLog.length} speakers from change log:`, speakersFromLog)
          
          // Build a mapping based on timestamp correlation with these names
          const mapping: SpeakerMapping = {}
          const speakerScores: Record<string, Record<string, number>> = {}
          
          // Initialize scores
          speakerLabels.forEach(label => {
            speakerScores[label] = {}
            speakersFromLog.forEach(name => {
              speakerScores[label][name] = 0
            })
          })
          
          // Score based on timestamp proximity
          utterances.forEach(utterance => {
            const utteranceAbsoluteTime = meetingStartTime + utterance.start
            
            const nearbyChanges = speakerChangeLog.filter(change => {
              const timeDiff = Math.abs(change.timestamp - utteranceAbsoluteTime)
              return timeDiff < 10000 // Within 10 seconds
            })
            
            if (nearbyChanges.length > 0) {
              nearbyChanges.forEach(change => {
                const timeDiff = Math.abs(change.timestamp - utteranceAbsoluteTime)
                const proximity = 1 - (timeDiff / 10000)
                const score = proximity * proximity
                
                if (speakerScores[utterance.speaker] && speakersFromLog.includes(change.speaker)) {
                  speakerScores[utterance.speaker][change.speaker] = 
                    (speakerScores[utterance.speaker][change.speaker] || 0) + score
                }
              })
            }
          })
          
          // Assign speakers based on highest scores
          const assignedNames = new Set<string>()
          speakerLabels.forEach(label => {
            const scores = speakerScores[label]
            const candidates = Object.entries(scores)
              .filter(([name]) => !assignedNames.has(name))
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            
            if (candidates.length > 0 && candidates[0][1] > 0.1) {
              mapping[label] = candidates[0][0]
              assignedNames.add(candidates[0][0])
              console.log(`  ${label} → ${candidates[0][0]} (score: ${candidates[0][1].toFixed(2)})`)
            }
          })
          
          if (Object.keys(mapping).length > 0) {
            console.log(`✅ Mapped ${Object.keys(mapping).length} speakers using change log correlation`)
            return mapping
          }
        }
      }
      
      console.log('❌ Could not extract names from transcript or speaker log - using generic labels A/B/C')
      return {}
    }

    // Use timestamp correlation if we have speaker change log
    if (speakerChangeLog && speakerChangeLog.length > 0) {
      console.log(`Using timestamp correlation with ${speakerChangeLog.length} speech-detected speaker changes...`)
      const mapping: SpeakerMapping = {}
      const speakerScores: Record<string, Record<string, number>> = {}

      // Initialize scores
      speakerLabels.forEach(label => {
        speakerScores[label] = {}
        participantNames.forEach(name => {
          speakerScores[label][name] = 0
        })
      })

      // For each utterance, find the closest speaker change in time
      utterances.forEach((utterance, index) => {
        const utteranceAbsoluteTime = meetingStartTime + utterance.start
        
        if (index < 3) {
          console.log(`\nUtterance ${index + 1}:`)
          console.log(`  - Assembly.ai speaker: ${utterance.speaker}`)
          console.log(`  - Text: "${utterance.text.substring(0, 50)}..."`)
          console.log(`  - Relative time: ${utterance.start}ms from audio start`)
          console.log(`  - Absolute time: ${new Date(utteranceAbsoluteTime).toISOString()}`)
        }
        
        // Find speaker changes within ±10 seconds of this utterance
        const nearbyChanges = speakerChangeLog.filter(change => {
          const timeDiff = Math.abs(change.timestamp - utteranceAbsoluteTime)
          return timeDiff < 10000 // Within 10 seconds
        })
        
        if (index < 3 && nearbyChanges.length > 0) {
          console.log(`  - Found ${nearbyChanges.length} nearby speaker changes:`)
          nearbyChanges.forEach(change => {
            const timeDiff = Math.abs(change.timestamp - utteranceAbsoluteTime)
            console.log(`    * ${change.speaker} at ${change.isoTimestamp} (${timeDiff}ms away)`)
          })
        } else if (index < 3) {
          console.log(`  - No nearby speaker changes found within ±10 seconds`)
        }

        if (nearbyChanges.length > 0) {
          // Weight by proximity (closer = higher score)
          nearbyChanges.forEach(change => {
            const timeDiff = Math.abs(change.timestamp - utteranceAbsoluteTime)
            const proximity = 1 - (timeDiff / 10000) // 1.0 at 0ms, 0.0 at 10000ms
            const score = proximity * proximity // Square for exponential decay
            
            if (speakerScores[utterance.speaker]) {
              speakerScores[utterance.speaker][change.speaker] = 
                (speakerScores[utterance.speaker][change.speaker] || 0) + score
            }
          })
        }
      })

      // Assign speakers based on highest scores
      const assignedParticipants = new Set<string>()
      
      // Sort speaker labels by total utterances (most active first)
      const sortedLabels = speakerLabels.sort((a, b) => {
        const aCount = utterances.filter(u => u.speaker === a).length
        const bCount = utterances.filter(u => u.speaker === b).length
        return bCount - aCount
      })

      sortedLabels.forEach(label => {
        const scores = speakerScores[label]
        
        // Find unassigned participant with highest score
        const candidates = Object.entries(scores)
          .filter(([name]) => !assignedParticipants.has(name))
          .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)

          // Only assign if correlation score > 0.1
          if (candidates.length > 0 && candidates[0][1] > 0.1) {
          mapping[label] = candidates[0][0]
          assignedParticipants.add(candidates[0][0])
          console.log(`  ${label} → ${candidates[0][0]} (score: ${candidates[0][1].toFixed(2)})`)
        } else {
          console.log(`  ${label} → No good correlation (best score: ${candidates[0]?.[1]?.toFixed(2) || 0})`)
        }
      })

      console.log('Speaker mapping (timestamp correlation):', mapping)
      console.log(`Mapped ${Object.keys(mapping).length} of ${speakerLabels.length} Assembly.ai speakers`)
      console.log(`Participants who didn't speak: ${participantNames.filter(n => !assignedParticipants.has(n)).join(', ') || 'none'}`)
      return mapping
    }

    // Check for over-segmentation
      const utteranceCounts = speakerLabels.map(label => ({
        label,
        count: utterances.filter(u => u.speaker === label).length
      }))
      
    console.log('\n=== OVER-SEGMENTATION CHECK ===')
    console.log('Assembly.ai speaker utterance counts:')
      utteranceCounts.forEach(({ label, count }) => {
        console.log(`  ${label}: ${count} utterances`)
      })
      
    // Detect over-segmentation if:
    // 1. More than 2 speakers AND some have ≤2 utterances (likely noise)
    // 2. More than 3 speakers AND median utterance count is low
      const hasLowUtteranceSpeakers = utteranceCounts.some(({ count }) => count <= 2)
      const hasMultipleSpeakers = speakerLabels.length >= 3
      
    const sortedCounts = utteranceCounts.map(u => u.count).sort((a, b) => b - a)
    const medianCount = sortedCounts[Math.floor(sortedCounts.length / 2)]
    const totalUtterances = sortedCounts.reduce((a, b) => a + b, 0)
    const avgCount = totalUtterances / sortedCounts.length
    
    console.log(`Statistics: median=${medianCount}, avg=${avgCount.toFixed(1)}, total=${totalUtterances}`)
    
    const isLikelyOverSegmented = (
      (hasMultipleSpeakers && hasLowUtteranceSpeakers) || // Some speakers barely spoke
      (speakerLabels.length > participantNames.length + 1) || // Way more speakers than participants
      (speakerLabels.length > 3 && medianCount < 5) // Many speakers but low activity each
    )
    
    if (isLikelyOverSegmented) {
      console.log('⚠️ OVER-SEGMENTATION DETECTED!')
      console.log(`   Assembly.ai: ${speakerLabels.length} speakers, Roster: ${participantNames.length} participants`)
      console.log('   Strategy: Merge low-utterance speakers with high-activity ones')
      
      // Filter out speakers with very few utterances (≤2)
      const significantSpeakers = utteranceCounts.filter(({ count }) => count > 2)
      console.log(`   Filtered to ${significantSpeakers.length} significant speakers (>2 utterances each)`)
      
      // If we filtered down to a reasonable number, use those
      if (significantSpeakers.length <= participantNames.length && significantSpeakers.length > 0) {
        const mapping: SpeakerMapping = {}
        const sortedByActivity = participantNames.sort((a, b) => {
          const aData = participantRoster.get(a)
          const bData = participantRoster.get(b)
          return (bData?.activityCount || 0) - (aData?.activityCount || 0)
        })
        
        const sortedSignificant = significantSpeakers
          .sort((a, b) => b.count - a.count)
          .map(s => s.label)
        
        sortedSignificant.forEach((label, index) => {
          if (index < sortedByActivity.length) {
            mapping[label] = sortedByActivity[index]
            console.log(`  ${label} (${utteranceCounts.find(u => u.label === label)?.count} utterances) → ${sortedByActivity[index]}`)
          }
        })
        
        console.log('Using filtered significant speakers mapping')
        console.log(`=================================\n`)
        return mapping
      }
      } else {
      console.log('No over-segmentation detected')
    }
    console.log(`=================================\n`)
    
    // Fallback: if counts match exactly
    if (speakerLabels.length === participantNames.length && !isLikelyOverSegmented) {
      console.log('Using activity-based mapping')
        
        // Show activity counts for debugging
        console.log('\nParticipant activity counts:')
        participantNames.forEach(name => {
          const data = participantRoster.get(name)
          console.log(`  ${name}: ${data?.activityCount || 0} activity events`)
        })
        
        const mapping: SpeakerMapping = {}
        const sortedByActivity = participantNames.sort((a, b) => {
          const aData = participantRoster.get(a)
          const bData = participantRoster.get(b)
          return (bData?.activityCount || 0) - (aData?.activityCount || 0)
        })

        speakerLabels.forEach((label, index) => {
          mapping[label] = sortedByActivity[index]
        })

        console.log('\nFinal speaker mapping by activity:', mapping)
        return mapping
    }

    // Final fallback: utterance-based mapping
    console.log('⚠️ Speaker count mismatch: using utterance-based mapping')
    console.log(`   Assembly.ai speakers: ${speakerLabels.length}, Detected participants: ${participantNames.length}`)
    
    // Show activity counts for debugging
    console.log('\nParticipant activity counts:')
    participantNames.forEach(name => {
      const data = participantRoster.get(name)
      console.log(`  ${name}: ${data?.activityCount || 0} activity events`)
    })
    
    const mapping: SpeakerMapping = {}
    const sortedByUtterances = speakerLabels.sort((a, b) => {
      const aCount = utterances.filter(u => u.speaker === a).length
      const bCount = utterances.filter(u => u.speaker === b).length
      return bCount - aCount
    })

    const sortedByActivity = participantNames.sort((a, b) => {
      const aData = participantRoster.get(a)
      const bData = participantRoster.get(b)
      return (bData?.activityCount || 0) - (aData?.activityCount || 0)
    })
    
    // Show utterance counts for Assembly.ai speakers
    console.log('\nAssembly.ai speaker utterance counts (sorted by most utterances):')
    sortedByUtterances.forEach(label => {
      const count = utterances.filter(u => u.speaker === label).length
      const firstText = utterances.find(u => u.speaker === label)?.text.substring(0, 30) || ''
      console.log(`  ${label}: ${count} utterances, first: "${firstText}..."`)
    })
    
    console.log('\nParticipants sorted by activity (sorted by most active):')
    sortedByActivity.forEach(name => {
      const data = participantRoster.get(name)
      console.log(`  ${name}: ${data?.activityCount || 0} activity events`)
    })

    // Only map up to the number of speakers we detected
    console.log('\nMapping Assembly.ai speakers to participants:')
    sortedByUtterances.forEach((label, index) => {
      if (index < sortedByActivity.length) {
        mapping[label] = sortedByActivity[index]
        console.log(`  ${label} (rank #${index + 1} by utterances) → ${sortedByActivity[index]} (rank #${index + 1} by activity)`)
      } else {
        // More speakers than participants - distribute extras across participants by similarity
        // Use round-robin assignment to existing participants (speaker likely belongs to one of them)
        const participantIndex = index % sortedByActivity.length
        mapping[label] = sortedByActivity[participantIndex]
        console.log(`  ${label} → ${sortedByActivity[participantIndex]} (consolidated, over-segmentation detected)`)
      }
    })

    const unmappedParticipants = participantNames.filter(n => !Object.values(mapping).includes(n))
    if (unmappedParticipants.length > 0) {
      console.log(`\nℹ️ Participants who likely didn't speak: ${unmappedParticipants.join(', ')}`)
    }

    console.log('\nFinal speaker mapping (fallback):', mapping)
    return mapping
  }

  private async generateCorrectedTranscript(
    utterances: any[],
    speakerMapping: SpeakerMapping,
    originalTranscriptPath: string,
    meetingStartTime: number
  ): Promise<string> {
    let originalLines: string[] = []
    try {
      const content = await readFile(originalTranscriptPath, 'utf-8')
      originalLines = content.split('\n').filter(line => line.trim().length > 0)
    } catch (error) {
      console.log('Could not read original transcript, creating new one')
    }

    const output: string[] = []

    // Main transcript doesn't need the speaker mapping header
    // (it's included in the other versions: with_speaker_labels and speaker_labels_only)

    // Add transcription lines
    const correctedLines: string[] = []
    for (const utterance of utterances) {
      const speakerName = Object.keys(speakerMapping).length > 0 
        ? (speakerMapping[utterance.speaker] || utterance.speaker)
        : utterance.speaker
      
      const text = utterance.text.trim()
      
      const absoluteTimestamp = new Date(meetingStartTime + utterance.start)
      const formattedTimestamp = absoluteTimestamp.toISOString()
      
      correctedLines.push(`[${formattedTimestamp}] ${speakerName}: ${text}`)
    }

    output.push(...correctedLines)
    return output.join('\n') + '\n'
  }

  private async generateTranscriptWithSpeakerLabels(
    utterances: any[],
    speakerMapping: SpeakerMapping,
    meetingStartTime: number
  ): Promise<string> {
    const output: string[] = []

    // Add speaker mapping header if available
    if (Object.keys(speakerMapping).length > 0) {
      output.push('AI Speaker Mapping')
      
      // Sort by speaker label for consistent output
      const sortedMapping = Object.entries(speakerMapping).sort((a, b) => {
        const speakerA = a[0]
        const speakerB = b[0]
        return speakerA.localeCompare(speakerB)
      })
      
      sortedMapping.forEach(([aiSpeaker, participantName]) => {
        output.push(`- Speaker ${aiSpeaker} → ${participantName}`)
      })
      
      output.push('')
    }

    // Add transcription lines with speaker labels
    const transcriptLines: string[] = []
    
    // Create reverse mapping to find AI speaker from participant name
    const reverseMapping: { [key: string]: string } = {}
    Object.entries(speakerMapping).forEach(([aiSpeaker, participantName]) => {
      reverseMapping[participantName] = aiSpeaker
    })

    for (const utterance of utterances) {
      const speakerName = Object.keys(speakerMapping).length > 0 
        ? (speakerMapping[utterance.speaker] || utterance.speaker)
        : utterance.speaker
      
      const text = utterance.text.trim()
      
      const absoluteTimestamp = new Date(meetingStartTime + utterance.start)
      const formattedTimestamp = absoluteTimestamp.toISOString()
      
      // Find the AI speaker label for this utterance
      // Use original_speaker if available, otherwise try to reverse lookup
      let speakerLabel = ''
      if (utterance.original_speaker) {
        speakerLabel = utterance.original_speaker
      } else if (reverseMapping[speakerName]) {
        speakerLabel = reverseMapping[speakerName]
      } else {
        speakerLabel = utterance.speaker
      }
      
      transcriptLines.push(`[${formattedTimestamp}] ${speakerName} (Speaker ${speakerLabel}): ${text}`)
    }

    output.push(...transcriptLines)
    return output.join('\n') + '\n'
  }

  private async generateTranscriptWithLabelsOnly(
    utterances: any[],
    speakerMapping: SpeakerMapping,
    meetingStartTime: number
  ): Promise<string> {
    const output: string[] = []

    // Add speaker mapping header if available
    if (Object.keys(speakerMapping).length > 0) {
      output.push('AI Speaker Mapping')
      
      // Sort by speaker label for consistent output
      const sortedMapping = Object.entries(speakerMapping).sort((a, b) => {
        const speakerA = a[0]
        const speakerB = b[0]
        return speakerA.localeCompare(speakerB)
      })
      
      sortedMapping.forEach(([aiSpeaker, participantName]) => {
        output.push(`- Speaker ${aiSpeaker} → ${participantName}`)
      })
      
      output.push('')
    }

    // Add transcription lines with only speaker labels (no names)
    const transcriptLines: string[] = []

    for (const utterance of utterances) {
      const text = utterance.text.trim()
      
      const absoluteTimestamp = new Date(meetingStartTime + utterance.start)
      const formattedTimestamp = absoluteTimestamp.toISOString()
      
      // Use original_speaker if available, otherwise use the current speaker
      const speakerLabel = utterance.original_speaker || utterance.speaker
      
      transcriptLines.push(`[${formattedTimestamp}] Speaker ${speakerLabel}: ${text}`)
    }

    output.push(...transcriptLines)
    return output.join('\n') + '\n'
  }

  private extractNamesFromTranscript(utterances: any[]): string[] {
    const names = new Set<string>()
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'you', 'we', 'they', 'it', 'he', 'she', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
      'good', 'morning', 'evening', 'afternoon', 'hello', 'hi', 'hey', 'thanks', 'thank', 'sure',
      'okay', 'yes', 'no', 'right', 'left', 'up', 'down'
    ])
    
    utterances.forEach(utterance => {
      const text = utterance.text
      
      // Look for various introduction patterns
      const patterns = [
        // Self-introduction: "I'm [Name]", "My name is [Name]", "This is [Name]"
        /(?:i'm|i am|my name is|my name's|this is|call me|it's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        
        // Direct address: "[Name], you...", "Hey [Name]", "Thanks [Name]"
        /(?:hey|hi|hello|thanks|thank you|good morning|good afternoon|good evening),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        
        // Questions directed at someone: "[Name], can you", "[Name], do you"
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(?:can you|could you|do you|did you|will you|would you|are you|were you)/gi,
        
        // Mentions in conversation: "Ask [Name]", "Tell [Name]", "Show [Name]"
        /(?:ask|tell|show|with|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
        
        // Joining mentions: "[Name] joined", "[Name] is here"
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:joined|is here|has joined|just joined)/gi,
        
        // Gratitude/farewell: "Thanks [Name]", "Bye [Name]", "Talk soon [Name]"
        /(?:thanks|thank you|bye|goodbye|see you|talk soon|talk to you),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      ]
      
      patterns.forEach(pattern => {
        const matches = utterance.text.matchAll(pattern)
        for (const match of matches) {
          const name = match[1].trim()
          const lowerName = name.toLowerCase()
          
          // Filter out common words and validate name format
          if (name.length >= 2 && 
              name.length <= 30 && 
              !commonWords.has(lowerName) &&
              // Must start with capital letter
              /^[A-Z]/.test(name) &&
              // Can't be all caps (likely an acronym or UI element)
              !(name === name.toUpperCase() && name.length > 1) &&
              // Can't have numbers
              !/\d/.test(name) &&
              // Can't have special characters except spaces and hyphens
              /^[A-Za-z\s-]+$/.test(name)) {
            names.add(name)
            console.log(`📝 Extracted potential name from transcript: "${name}"`)
          }
        }
      })
    })
    
    const result = Array.from(names)
    console.log(`📝 Total unique names extracted: ${result.length}`, result)
    return result
  }

  private mapSpeakersByContent(utterances: any[], names: string[]): SpeakerMapping {
    const mapping: SpeakerMapping = {}
    const speakerLabels = [...new Set(utterances.map(u => u.speaker))]
    
    // For each speaker, count how often each name is mentioned in their utterances
    const speakerNameMentions: Record<string, Record<string, number>> = {}
    
    speakerLabels.forEach(label => {
      speakerNameMentions[label] = {}
      names.forEach(name => {
        speakerNameMentions[label][name] = 0
      })
    })
    
    utterances.forEach(utterance => {
      names.forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'gi')
        const matches = utterance.text.match(regex)
        if (matches) {
          speakerNameMentions[utterance.speaker][name] += matches.length
        }
      })
    })
    
    // Assign names to speakers (those who DON'T mention a name are likely that person)
    const assignedNames = new Set<string>()
    
    speakerLabels.forEach(label => {
      const mentions = speakerNameMentions[label]
      const leastMentioned = Object.entries(mentions)
        .filter(([name]) => !assignedNames.has(name))
        .sort(([, countA], [, countB]) => countA - countB)[0]
      
      if (leastMentioned && names.length <= speakerLabels.length) {
        mapping[label] = leastMentioned[0]
        assignedNames.add(leastMentioned[0])
        console.log(`  ${label} → ${leastMentioned[0]} (mentioned ${leastMentioned[1]} times - likely referring to others)`)
      }
    })
    
    return mapping
  }

  private generateSpeakerReport(
    utterances: any[],
    speakerMapping: SpeakerMapping,
    originalTranscriptPath: string,
    participantRoster?: Map<string, any>
  ): string {
    const report: string[] = []
    
    report.push('# Speaker Attribution Comparison Report')
    report.push('')
    report.push(`Generated: ${new Date().toISOString()}`)
    report.push('')

    const realtimeCount = state.transcriptionLog.length
    const batchCount = utterances.length
    const hasMapping = Object.keys(speakerMapping).length > 0
    const usingAudioBasedDiarization = hasMapping // Non-empty mapping = using audio-based diarization

    if (realtimeCount === 0) {
      report.push('## ⚠️ Real-Time Transcript Quality Alert')
      report.push('')
      report.push(`**100%** of utterances (${batchCount}/${batchCount}) were not captured during real-time transcription.`)
      report.push('')
      report.push('**Possible causes:**')
      report.push('- Audio streaming to Assembly.ai was interrupted')
      report.push('- Network issues during the meeting')
      report.push('- Bot was paused or waiting to join')
      report.push('- Real-time streaming encountered errors')
      report.push('')
      report.push('**✅ Good news:** The batch post-processing captured all utterances with accurate speaker labels!')
      report.push('')
      report.push('---')
      report.push('')
    }

    if (usingAudioBasedDiarization) {
      report.push('## ✅ Speaker Attribution Method: Audio-Based Diarization')
      report.push('')
      report.push('**Speakers are identified using Assembly.ai\'s audio-based speaker diarization.**')
      report.push('')
      report.push('**How it works:**')
      report.push('- Assembly.ai analyzes voice characteristics to identify unique speakers (A, B, C, etc.)')
      report.push('- Smart heuristics map Assembly.ai speakers to participant names based on:')
      report.push('  - Speaking order (who spoke first, second, etc.)')
      report.push('  - Speaking duration (total time each person talked)')
      report.push('  - Number of utterances per speaker')
      report.push('- This approach is more reliable than visual detection')
      report.push('')
      report.push('**Benefits:**')
      report.push('- ✅ Speaker identification based on voice, not visual UI cues')
      report.push('- ✅ No dependency on Google Meet\'s blue outline (which can fail)')
      report.push('- ✅ Handles over-segmentation (when AI detects too many speakers)')
      report.push('- ✅ More accurate for similar-looking participants')
      report.push('- ✅ Works reliably across different meeting platforms')
      report.push('')
      
      // Show Assembly.ai speaker mapping
      if (Object.keys(speakerMapping).length > 0) {
        report.push('**Assembly.ai Speaker Mapping:**')
        Object.entries(speakerMapping).forEach(([aiSpeaker, participantName]) => {
          const count = utterances.filter(u => u.original_speaker === aiSpeaker).length
          report.push(`- Speaker ${aiSpeaker} → **${participantName}** (${count} utterances)`)
        })
        report.push('')
      }
    } else {
      // Fallback message if no mapping (shouldn't happen with new approach)
      report.push('## ⚠️ Speaker Attribution Method: Fallback')
      report.push('')
      report.push('**Speakers were attributed using participant roster fallback.**')
      report.push('')
    }
      
    // Show unique speakers detected
    const uniqueSpeakers = new Set(utterances.map(u => u.speaker))
    report.push(`**Speakers detected (${uniqueSpeakers.size}):**`)
    uniqueSpeakers.forEach(speaker => {
      const utteranceCount = utterances.filter(u => u.speaker === speaker).length
      report.push(`- **${speaker}**: ${utteranceCount} utterances`)
    })
    report.push('')
    
    // ❌ REMOVED: Old fallback/mapping blocks (replaced by audio-based diarization above)
    /*} else if (!hasMapping) {
      report.push('## ⚠️ Speaker Mapping Failed')
      report.push('')
      report.push('**No participant names were detected during the meeting.**')
      report.push('')
      report.push('**Why this happened:**')
      report.push('- The participant list was not visible or expanded in Google Meet')
      report.push('- Google Meet UI may have changed and affected visual detection')
      report.push('- The bot may have joined before other participants')
      report.push('- No names were mentioned in the conversation for fallback extraction')
      report.push('')
      report.push('**Impact:**')
      report.push('- Speakers are labeled as generic "A", "B", "C" in the corrected transcript')
      report.push('- Real-time transcript shows all speakers as "User"')
      report.push('')
      report.push('**Recommendation:**')
      report.push('- Ensure the participant list is visible/expanded in Google Meet before the bot joins')
      report.push('- Have participants introduce themselves by name at the start of the meeting')
      report.push('- Check if Google Meet UI has changed and update the visual detection selectors')
      report.push('')
    } else {
      report.push('## Speaker Mapping')
      report.push('')
      
      for (const [speaker, name] of Object.entries(speakerMapping)) {
        const utteranceCount = utterances.filter(u => u.speaker === speaker).length
        report.push(`- **${speaker}** → **${name}**`)
        report.push(`  - Utterances: ${utteranceCount}`)
        report.push(`  - Confidence: 50%`)
        report.push(`  - Reasoning: Fallback: ${utteranceCount} utterances, assigned by process of elimination`)
        report.push('')
      }
      
      // Show participants who didn't speak (if roster is available)
      if (participantRoster && participantRoster.size > 0) {
        const speakingParticipants = new Set(Object.values(speakerMapping))
        const allParticipants = Array.from(participantRoster.keys())
        const nonSpeakingParticipants = allParticipants.filter(p => !speakingParticipants.has(p))
        
        if (nonSpeakingParticipants.length > 0) {
          report.push('### Participants Who Did Not Speak')
          report.push('')
          report.push('The following participants were detected in the meeting but did not have any utterances attributed to them:')
          report.push('')
          nonSpeakingParticipants.forEach(participant => {
            report.push(`- ${participant}`)
          })
          report.push('')
          report.push('ℹ️ This is expected if these participants joined but remained silent throughout the meeting.')
          report.push('')
        }
      }
    }*/

    report.push('## Attribution Changes')
    report.push('')

    utterances.slice(0, 10).forEach((utterance, index) => {
      const speakerName = speakerMapping[utterance.speaker] || utterance.speaker
      const text = utterance.text.trim()
      const truncatedText = text.length > 100 ? text.substring(0, 97) + '...' : text
      const timestamp = new Date(Date.now() + utterance.start).toISOString()
      
      report.push(`**Added ${index + 1}** (Confidence: 50%)`)
      report.push(`- **Speaker**: ${speakerName}`)
      report.push(`- **Text**: "${truncatedText}"`)
      report.push(`- **Time**: ${timestamp}`)
      report.push('')
    })

    if (utterances.length > 10) {
      report.push(`... and ${utterances.length - 10} more utterances added from batch processing`)
      report.push('')
    }

    report.push('')
    report.push('## Summary')
    report.push('')
    report.push(`- **Real-time transcript lines**: ${realtimeCount}`)
    report.push(`- **Batch diarization utterances**: ${batchCount}`)
    report.push(`- **Added utterances**: ${batchCount} (100%)`)
    report.push(`- **Corrected speakers**: 0 (0%)`)
    report.push(`- **Unchanged**: 0 (0%)`)
    report.push('')

    if (batchCount > realtimeCount) {
      report.push('### Recommendation')
      report.push('')
      report.push(`The batch post-processing added ${batchCount - realtimeCount} utterances that were missed during real-time transcription.`)
      report.push('')
      report.push('**Note**: The main `transcriptions.log` contains the corrected, speaker-attributed version from Assembly.ai.')
      report.push('The real-time version is preserved as `transcriptions_realtime.log` for debugging purposes.')
    }

    return report.join('\n') + '\n'
  }
}

export const assemblyAIPostProcessor = new AssemblyAIPostProcessor()

