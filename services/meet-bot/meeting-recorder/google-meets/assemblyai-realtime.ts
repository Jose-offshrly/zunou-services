/**
 * Assembly.ai Real-Time Transcription
 * 
 * Streaming transcription with visual speaker detection from Google Meet.
 */

import { AssemblyAI } from 'assemblyai'
import { appendFile } from 'fs/promises'
import state from './state.ts'
import { env } from './env.ts'

interface VisualDetectionStats {
  totalTranscripts: number
  unknownSpeakerCount: number
  validSpeakerCount: number
  lastValidSpeakerTime: number
  speakerChanges: number
}

interface AudioChunkRecord {
  timestamp: number
  speaker: string
  durationMs: number
}

class AssemblyAIRealtime {
  private transcriber: any = null
  private client: AssemblyAI | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private stats: VisualDetectionStats = {
    totalTranscripts: 0,
    unknownSpeakerCount: 0,
    validSpeakerCount: 0,
    lastValidSpeakerTime: 0,
    speakerChanges: 0
  }
  private lastSpeaker: string = ''
  
  private recentTranscripts: Array<{speaker: string, text: string, timestamp: number}> = []
  private readonly MAX_RECENT_HISTORY = 10
  private readonly SIMILARITY_THRESHOLD = 0.75
  
  private isRosterReady: boolean = false
  private earlyTranscriptBuffer: Array<{text: string, timestamp: number}> = []
  private readonly MAX_BUFFER_SIZE = 20
  
  // Keep track of recent audio chunks so we can figure out who was speaking
  // when transcripts arrive (they come back with a delay)
  private audioChunkTimeline: AudioChunkRecord[] = []
  private readonly MAX_AUDIO_TIMELINE = 1000 // About 60 seconds of history
  private lastAudioTimestamp: number = 0
  
  // Custom words/names that need better recognition
  private keyterms: string[] = []
  
  // Track whether formatTurns is enabled to handle duplicates
  private isFormatTurnsEnabled: boolean = false
  
  async start(keyterms?: string[]) {
    try {
      console.log('[Assembly.ai RT] Starting real-time transcription...')
      console.log('[Assembly.ai RT] API Key configured:', env.ASSEMBLYAI_API_KEY ? 'YES (length: ' + env.ASSEMBLYAI_API_KEY.length + ')' : 'NO')
      console.log('[Assembly.ai RT] Network environment:')
      console.log('   - HTTP_PROXY:', process.env.HTTP_PROXY || 'not set')
      console.log('   - HTTPS_PROXY:', process.env.HTTPS_PROXY || 'not set')
      console.log('   - NO_PROXY:', process.env.NO_PROXY || 'not set')
      
      // Fresh start - clear out any old audio tracking
      this.audioChunkTimeline = []
      this.lastAudioTimestamp = 0
      console.log('[Assembly.ai RT] Audio timeline correlation ENABLED')
      
      // Figure out which keyterms to use - merge custom ones with our defaults
      const defaultKeyterms = this.getDefaultKeyterms()
      
      if (keyterms && keyterms.length > 0) {
        // Combine custom keyterms with defaults, removing any duplicates
        const mergedKeyterms = new Set([...defaultKeyterms, ...keyterms])
        this.keyterms = Array.from(mergedKeyterms)
        
        // AssemblyAI has a hard limit of 100 keyterms
        if (this.keyterms.length > 100) {
          console.log(`[Assembly.ai RT] ⚠️ Too many keyterms (${this.keyterms.length}), keeping first 100`)
          this.keyterms = this.keyterms.slice(0, 100)
        }
      } else {
        // No custom keyterms provided, just use the defaults
        this.keyterms = defaultKeyterms
      }
      
      if (this.keyterms.length > 0) {
        console.log('[Assembly.ai RT] Keyterms prompting ENABLED:', this.keyterms.length, 'terms')
        console.log('[Assembly.ai RT] Keyterms:', this.keyterms.slice(0, 10).join(', '), this.keyterms.length > 10 ? '...' : '')
      }
      
      // Set up the AssemblyAI client
      this.client = new AssemblyAI({
        apiKey: env.ASSEMBLYAI_API_KEY
      })
      
      const transcriberConfig: any = {
        sampleRate: 16000,
        encoding: 'pcm_s16le' as any,
        formatTurns: true,  // Enables post-processing pass for better keyterms accuracy
        
        // Turn detection settings - commented out due to speaker tagging issues with quick exchanges
        // These settings affect when AssemblyAI considers a turn complete, but can cause
        // misattribution when speakers change rapidly (every 1-2 seconds)
        // endOfTurnConfidenceThreshold: 0.4,  // How confident to be before ending turn (0-1)
        // minEndOfTurnSilenceWhenConfident: 400,  // Min silence in ms when we're confident
        // maxTurnSilence: 1280,  // Max silence before we force end the turn
        
        // Uncomment for multilingual meetings (EN, ES, FR, DE, IT, PT)
        // speechModel: 'universal-streaming-multi',
      }
      
      // Tell AssemblyAI about our keyterms if we have any
      if (this.keyterms.length > 0) {
        transcriberConfig.keytermsPrompt = this.keyterms
      }
      
      // Track formatTurns setting to handle duplicate filtering
      this.isFormatTurnsEnabled = transcriberConfig.formatTurns === true
      
      this.transcriber = this.client.streaming.transcriber(transcriberConfig)
      
      console.log('[Assembly.ai RT] Connecting to streaming service (16kHz)...')
      
      const connectPromise = this.transcriber.connect()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 15s')), 15000)
      )
      
      await Promise.race([connectPromise, timeoutPromise])
      
      this.isConnected = true
      this.reconnectAttempts = 0
      
      console.log('[Assembly.ai RT] Connected successfully')
      
      this.transcriber.on('open', (data: any) => {
        console.log(`[Assembly.ai RT] Session opened:`, JSON.stringify(data))
      })
      
      this.transcriber.on('turn', (data: any) => {
        this.handleTranscript(data)
      })
      
      this.transcriber.on('error', (error: Error) => {
        console.error('[Assembly.ai RT] Streaming error:', error)
        console.error('[Assembly.ai RT] Error details:', error.message)
        console.error('[Assembly.ai RT] Error stack:', error.stack)
        this.handleError(error)
      })
      
      this.transcriber.on('close', (code: number, reason: string) => {
        console.log(`[Assembly.ai RT] Connection closed (${code}: ${reason})`)
        this.isConnected = false
        
        if (state.isBotRunning && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`[Assembly.ai RT] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
          setTimeout(() => this.start(), 2000)
        }
      })
      
    } catch (error: any) {
      console.error('[Assembly.ai RT] Failed to start:', error)
      console.error('[Assembly.ai RT]', error?.message || 'Unknown error')
      if (error?.code) console.error('[Assembly.ai RT] Error code:', error.code)
      
      this.isConnected = false
      console.log('[Assembly.ai RT] Falling back to batch processing')
    }
  }
  
  /**
   * Figure out who was speaking when this transcript happened.
   * Since transcripts arrive with a delay, we need to look back at our audio timeline.
   * 
   * KEY INSIGHT: Transcripts can contain 5-10 seconds of speech, but AssemblyAI has
   * a 2-3 second processing delay. We need to look at who was speaking DURING THE
   * SPEECH PERIOD, not who's speaking when the transcript arrives.
   * 
   * Example problem we're solving:
   * - Speaker A talks for 10 seconds
   * - Speaker B suddenly interrupts
   * - Transcript arrives (containing mostly A's words)
   * - We were checking "who's speaking now?" → B
   * - ❌ Wrong! We should check "who was speaking 2-3 seconds ago?" → A
   */
  private correlateSpeakerFromTimeline(transcriptCompletionTime: number): string {
    // AssemblyAI's typical processing delay is 2-3 seconds
    // The speech in this transcript actually happened BEFORE now
    const processingDelayMs = 2500 // Average 2.5 second delay
    const speechEndTime = transcriptCompletionTime - processingDelayMs
    
    // Transcripts typically contain 3-8 seconds of speech
    // Look at who was dominant during that SPEECH period, not now
    const typicalTranscriptDuration = 5000 // Assume ~5 seconds of speech per transcript
    const speechStartTime = speechEndTime - typicalTranscriptDuration
    
    // Check if there was a speaker change DURING the speech period
    const speakerChangesDuringSpeech = state.speakerChangeLog.filter(
      change => change.timestamp >= speechStartTime && change.timestamp <= speechEndTime
    )
    
    // Get audio chunks from the actual SPEECH period (not current time)
    const speechPeriodChunks = this.audioChunkTimeline.filter(
      chunk => chunk.timestamp >= speechStartTime && chunk.timestamp <= speechEndTime
    )
    
    if (Math.random() < 0.05) {
      console.log(`[Assembly.ai RT] 📊 Speech period: ${new Date(speechStartTime).toISOString().split('T')[1]} - ${new Date(speechEndTime).toISOString().split('T')[1]}`)
      console.log(`[Assembly.ai RT] 📊 Found ${speechPeriodChunks.length} chunks, ${speakerChangesDuringSpeech.length} changes during speech`)
    }
    
    if (speechPeriodChunks.length === 0) {
      // No audio data for this period - fall back to current speaker
      console.log(`[Assembly.ai RT] ⚠️ No audio chunks in speech period, using current: ${state.currentSpeaker}`)
      return state.currentSpeaker || 'Unknown User'
    }
    
    // If there was NO speaker change during the speech, use the dominant speaker
    // If there WAS a change, we need to be more careful
    if (speakerChangesDuringSpeech.length === 0) {
      // No speaker change - straightforward case, find dominant speaker
      const speakerDurations = new Map<string, number>()
      
      for (const chunk of speechPeriodChunks) {
        if (chunk.speaker === 'Unknown User' || chunk.speaker === 'User' || chunk.speaker === 'Unknown') {
          continue
        }
        const current = speakerDurations.get(chunk.speaker) || 0
        speakerDurations.set(chunk.speaker, current + chunk.durationMs)
      }
      
      if (speakerDurations.size === 0) {
        return state.currentSpeaker || this.lastSpeaker || 'Unknown User'
      }
      
      let maxDuration = 0
      let dominantSpeaker = ''
      for (const [speaker, duration] of speakerDurations.entries()) {
        if (duration > maxDuration) {
          maxDuration = duration
          dominantSpeaker = speaker
        }
      }
      
      if (Math.random() < 0.05) {
        const durStr = Array.from(speakerDurations.entries())
          .map(([s, d]) => `${s}:${Math.round(d)}ms`)
          .join(', ')
        console.log(`[Assembly.ai RT] 📊 No change during speech - Durations: ${durStr} → ${dominantSpeaker}`)
      }
      
      return dominantSpeaker || state.currentSpeaker || 'Unknown User'
    }
    
    // Speaker changed during the transcript period - this is the tricky case
    // We need to figure out who spoke for MOST of the transcript
    const lastChange = speakerChangesDuringSpeech[speakerChangesDuringSpeech.length - 1]
    const timeAfterChange = speechEndTime - lastChange.timestamp
    
    // If the change happened very recently (last 20% of transcript), 
    // the majority of the transcript is from the PREVIOUS speaker
    if (timeAfterChange < typicalTranscriptDuration * 0.2) {
      // Change was at the end - attribute to the speaker BEFORE the change
      const chunksBeforeChange = speechPeriodChunks.filter(
        chunk => chunk.timestamp < lastChange.timestamp
      )
      
      const speakerBeforeChange = this.getDominantSpeaker(chunksBeforeChange)
      
      if (Math.random() < 0.1) {
        console.log(`[Assembly.ai RT] 🔄 Speaker changed near END (${Math.round(timeAfterChange)}ms ago) - using speaker before change: ${speakerBeforeChange}`)
      }
      
      return speakerBeforeChange || state.currentSpeaker || 'Unknown User'
    }
    
    // Change happened earlier - use duration-based attribution for the whole period
    const dominantSpeaker = this.getDominantSpeaker(speechPeriodChunks)
    
    if (Math.random() < 0.1) {
      console.log(`[Assembly.ai RT] 🔄 Speaker changed during speech (${speakerChangesDuringSpeech.length} times) - dominant: ${dominantSpeaker}`)
    }
    
    return dominantSpeaker || state.currentSpeaker || 'Unknown User'
  }
  
  /**
   * Helper: Find the speaker who talked the most in a set of audio chunks
   */
  private getDominantSpeaker(chunks: AudioChunkRecord[]): string {
    const speakerDurations = new Map<string, number>()
    
    for (const chunk of chunks) {
      if (chunk.speaker === 'Unknown User' || chunk.speaker === 'User' || chunk.speaker === 'Unknown') {
        continue
      }
      const current = speakerDurations.get(chunk.speaker) || 0
      speakerDurations.set(chunk.speaker, current + chunk.durationMs)
    }
    
    if (speakerDurations.size === 0) {
      return ''
    }
    
    let maxDuration = 0
    let dominant = ''
    for (const [speaker, duration] of speakerDurations.entries()) {
      if (duration > maxDuration) {
        maxDuration = duration
        dominant = speaker
      }
    }
    
    return dominant
  }
  
  private async handleTranscript(data: any) {
    try {
      const text = data.text?.trim() || data.transcript?.trim() || ''
      const isFormatted = data.turn_is_formatted === true
      const isFinal = data.end_of_turn === true
      
    if (!text) return
    
    if (!isFinal) {
      // Just a partial transcript, not the final one yet - skip it
      if (Math.random() < 0.02) {
        console.log(`[Assembly.ai RT] Partial: "${text.substring(0, 60)}..."`)
      }
      return
    }
    
    // If formatTurns is enabled, only process the formatted version to avoid duplicates
    // (AssemblyAI sends both unformatted and formatted turn events)
    if (this.isFormatTurnsEnabled && !isFormatted) {
      if (Math.random() < 0.05) {
        console.log(`[Assembly.ai RT] Skipping unformatted turn (waiting for formatted version)`)
      }
      return
    }
    
    const boostIndicator = isFormatted ? '✨' : ''
    console.log(`[Assembly.ai RT] ${boostIndicator}Final: "${text.substring(0, 50)}..."`)
    
    if (!this.isRosterReady && state.participantRoster.size === 0) {
      // Don't know who anyone is yet - save this for later
      if (this.earlyTranscriptBuffer.length < this.MAX_BUFFER_SIZE) {
        this.earlyTranscriptBuffer.push({ text, timestamp: Date.now() })
        console.log(`[Assembly.ai RT] Buffered (${this.earlyTranscriptBuffer.length}/${this.MAX_BUFFER_SIZE})`)
      }
      return
    }
    
    const transcriptTime = Date.now()
    
    // Figure out who was actually speaking using our timeline
    const currentSpeakerAtTranscript = state.currentSpeaker || 'Unknown User'
    let speaker = this.correlateSpeakerFromTimeline(transcriptTime)
    
    // Log when the timeline changes our speaker attribution
    if (speaker !== currentSpeakerAtTranscript) {
      console.log(`[Assembly.ai RT] 🔄 Timeline correlation: ${currentSpeakerAtTranscript} → ${speaker}`)
    }
      
    if (speaker !== this.lastSpeaker && speaker !== 'Unknown User' && speaker !== 'User') {
      this.stats.speakerChanges++
      this.lastSpeaker = speaker
    }
    
    // Still don't know who's speaking? Try some fallback logic
    if (speaker === 'Unknown User' || speaker === 'User') {
      this.stats.unknownSpeakerCount++
      
      // Grab the most recently active participant who isn't the bot
      const recentParticipants = Array.from(state.participantRoster.values())
        .filter(p => p.name !== state.botName && p.name !== 'Unknown' && p.name !== 'User')
        .sort((a, b) => b.lastActive - a.lastActive)
      
      // If someone was active in the last 10 seconds, probably them
      if (recentParticipants.length > 0 && Date.now() - recentParticipants[0].lastActive < 10000) {
        speaker = recentParticipants[0].name
      } else if (this.lastSpeaker) {
        // Just use whoever spoke last
        speaker = this.lastSpeaker
      }
    } else {
      this.stats.validSpeakerCount++
      this.stats.lastValidSpeakerTime = Date.now()
    }
      
      await this.logFinalTranscript(speaker, text)
      
    } catch (error) {
      console.error('[Assembly.ai RT] Error handling transcript:', error)
    }
  }
  
  private isTranscriptTooShort(text: string): boolean {
    const trimmed = text.trim()
    const lowerText = trimmed.toLowerCase()
    
    const automatedPhrases = [
      'thank you', 'thank you for watching', 'thanks for watching',
      'i don\'t know what to say', 'i don\'t know', 'i do not know what to say'
    ]
    if (automatedPhrases.some(phrase => lowerText === phrase)) {
      return true
    }
    
    if (trimmed.length < 10) return true
    
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount <= 2) {
      const meaningful = [
        'sounds good', 'good morning', 'good afternoon', 'good evening',
        'got it', 'makes sense', 'no problem', 'you\'re welcome',
        'of course', 'not yet', 'right now', 'thank you', 'thanks team'
      ]
      return !meaningful.some(phrase => lowerText === phrase)
    }
    
    return false
  }
  
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
  
  private isDuplicateTranscript(speaker: string, text: string): boolean {
    const now = Date.now()
    
    this.recentTranscripts = this.recentTranscripts.filter(
      entry => now - entry.timestamp < 30000
    )
    
    for (let i = 0; i < this.recentTranscripts.length; i++) {
      const recent = this.recentTranscripts[i]
      
      if (recent.speaker !== speaker || now - recent.timestamp > 15000) continue
      
      const similarity = this.calculateSimilarity(text, recent.text)
      
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        if (text.length > recent.text.length * 1.2) {
          this.recentTranscripts.splice(i, 1)
          return false
        }
        return true
      }
    }
    
    return false
  }
  
  /**
   * Save the final transcript to file/state.
   * Includes filtering for junk like automated phrases and duplicates.
   */
  private async logFinalTranscript(speaker: string, text: string, isForceFlush: boolean = false) {
    try {
      // If we're force-flushing (meeting ending), check if transcript looks complete
      if (isForceFlush) {
        const trimmedText = text.trim()
        const endsWithIncompleteWord = /\w+$/.test(trimmedText) // No punctuation at end
        const endsWithConnector = /\b(and|but|or|so|that|the|a|an|in|on|at|to|for|of|with|is|are|was|were|will|would|should|could)\s*$/i.test(trimmedText)
        const isTooShort = trimmedText.split(' ').length < 3
        
        // Skip if it looks like the person was mid-sentence
        if ((endsWithIncompleteWord && endsWithConnector) || isTooShort) {
          console.log(`[Assembly.ai RT] Skipping incomplete transcript: "${trimmedText}"`)
          return
        }
      }
      
      // Skip garbage transcripts (automated phrases, too short, etc)
      if (!isForceFlush) {
        if (this.isTranscriptTooShort(text)) return
        if (this.isDuplicateTranscript(speaker, text)) return
      }
      
      this.stats.totalTranscripts++
      
      const timestamp = new Date().toISOString()
      const line = `[${timestamp}] ${speaker}: ${text}`
      
      if (state.transcriptionLogPath) {
        await appendFile(state.transcriptionLogPath, line + '\n')
        const truncatedText = text.length > 80 ? text.substring(0, 77) + '...' : text
        console.log(`[Assembly.ai RT] ${speaker}: ${truncatedText}`)
      }
      
      state.transcriptionLog.push(line)
      
      this.recentTranscripts.push({ speaker, text, timestamp: Date.now() })
      if (this.recentTranscripts.length > this.MAX_RECENT_HISTORY) {
        this.recentTranscripts.shift()
      }
      
    } catch (error) {
      console.error('[Assembly.ai RT] Error logging final transcript:', error)
    }
  }
  
  private handleError(error: Error) {
    console.error('[Assembly.ai RT]', error.message)
    this.isConnected = false
    
    if (state.isBotRunning && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[Assembly.ai RT] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => this.start(), 3000)
    }
  }
  
  sendAudio(chunk: Buffer, speaker?: string, sampleRate: number = 16000) {
    if (this.transcriber && this.isConnected) {
      try {
        this.transcriber.sendAudio(chunk)
        
        // Remember who was speaking when we sent this audio
        // (we'll need this later to match up with transcripts)
        const now = Date.now()
        const currentSpeaker = speaker || state.currentSpeaker || 'Unknown User'
        const durationMs = (chunk.length / 2 / sampleRate) * 1000 // PCM 16-bit = 2 bytes per sample
        
        this.audioChunkTimeline.push({
          timestamp: now,
          speaker: currentSpeaker,
          durationMs: durationMs
        })
        
        // Don't let the timeline get too big - keep about a minute of history
        if (this.audioChunkTimeline.length > this.MAX_AUDIO_TIMELINE) {
          this.audioChunkTimeline.shift()
        }
        
        this.lastAudioTimestamp = now
        
        // Occasional debug logging
        if (Math.random() < 0.02) {
          console.log(`[Assembly.ai RT] 📌 Tracked chunk: ${currentSpeaker} at ${new Date(now).toISOString().split('T')[1]} (~${Math.round(durationMs)}ms, timeline: ${this.audioChunkTimeline.length} chunks)`)
        }
        
        if (this.stats.totalTranscripts === 0 && Math.random() < 0.1) {
          console.log(`[Assembly.ai RT] Sent audio (${chunk.length} bytes, ~${Math.round(durationMs)}ms, speaker: ${currentSpeaker})`)
        }
      } catch (error) {
        console.error('[Assembly.ai RT] Send error:', error)
        this.isConnected = false
      }
    }
  }
  
  getVisualDetectionStats() {
    const totalWithSpeaker = this.stats.validSpeakerCount + this.stats.unknownSpeakerCount
    const visualDetectionRate = totalWithSpeaker > 0 
      ? (this.stats.validSpeakerCount / totalWithSpeaker) * 100 
      : 0
    
    return {
      ...this.stats,
      visualDetectionRate,
      isVisualDetectionWorking: visualDetectionRate > 70,
      needsBatchFallback: visualDetectionRate < 70
    }
  }
  
  logStats() {
    const stats = this.getVisualDetectionStats()
    
    console.log(`\n=== ASSEMBLY.AI REAL-TIME STATISTICS ===`)
    console.log(`Total transcripts: ${stats.totalTranscripts}`)
    console.log(`Valid speakers: ${stats.validSpeakerCount}`)
    console.log(`Unknown speakers: ${stats.unknownSpeakerCount}`)
    console.log(`Speaker changes: ${stats.speakerChanges}`)
    console.log(`Visual detection rate: ${stats.visualDetectionRate.toFixed(1)}%`)
    console.log(`Audio chunks tracked: ${this.audioChunkTimeline.length}`)
    console.log(`Timeline correlation: ENABLED`)
    console.log(`Status: ${stats.isVisualDetectionWorking ? 'Good' : 'Poor - needs batch fallback'}`)
    console.log(`=========================================\n`)
  }
  
  async stop() {
    if (this.transcriber && this.isConnected) {
      console.log('[Assembly.ai RT] Stopping...')
      try {
        await this.transcriber.close()
        this.isConnected = false
      } catch (error) {
        console.error('[Assembly.ai RT] Stop error:', error)
      }
    }
    
    // Clear audio timeline
    console.log(`[Assembly.ai RT] Clearing audio timeline (${this.audioChunkTimeline.length} chunks tracked)`)
    this.audioChunkTimeline = []
    
    this.logStats()
  }
  
  async notifyRosterReady() {
    if (this.isRosterReady) {
      return
    }
    
    this.isRosterReady = true
    console.log('[Assembly.ai RT] Roster ready')
    
    if (this.earlyTranscriptBuffer.length > 0) {
      console.log(`[Assembly.ai RT] Replaying ${this.earlyTranscriptBuffer.length} buffered transcripts`)
      
      const defaultSpeaker = Array.from(state.participantRoster.values())
        .filter(p => p.name !== state.botName && p.name !== 'Unknown' && p.name !== 'User')
        .sort((a, b) => b.lastActive - a.lastActive)[0]?.name || state.currentSpeaker || 'Unknown User'
      
      for (const buffered of this.earlyTranscriptBuffer) {
        console.log(`   [${defaultSpeaker}] "${buffered.text.substring(0, 40)}..."`)
        await this.logFinalTranscript(defaultSpeaker, buffered.text)
        this.stats.totalTranscripts++
        this.stats.validSpeakerCount++
      }
      
      this.earlyTranscriptBuffer = []
    }
  }
  
  /**
   * Default list of technical/business terms that tend to get misrecognized.
   * These help with general accuracy even if no custom keyterms are provided.
   */
  private getDefaultKeyterms(): string[] {
    return [
      // Meeting platforms
      'Google Meet',
      'Zoom',
      'Microsoft Teams',
      'Slack',
      
      // Common technical terms
      'API',
      'UI',
      'UX',
      'AWS',
      'GitHub',
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'Kubernetes',
      'Docker',
      'TypeScript',
      'JavaScript',
      'React',
      'Vue',
      'Angular',
      'Node.js',
      'GraphQL',
      'REST API',
      'OAuth',
      'JWT',
      
      // Business terms
      'KPI',
      'ROI',
      'B2B',
      'B2C',
      'SaaS',
      'MVP',
      'POC',
    ]
  }
  
  /**
   * Try to update keyterms while the session is running.
   * Note: Currently doesn't work - would need to reconnect for changes to take effect.
   */
  async updateKeyterms(newKeyterms: string[]) {
    if (!this.isConnected) {
      console.log('[Assembly.ai RT] Cannot update keyterms - not connected')
      return
    }
    
    console.log(`[Assembly.ai RT] Updating keyterms: ${newKeyterms.length} terms`)
    this.keyterms = newKeyterms
    
    // TODO: The Node SDK doesn't support live config updates yet
    // Would need to disconnect and reconnect for this to actually work
    console.log('[Assembly.ai RT] ⚠️ Keyterms updated internally, but requires reconnection to take effect')
  }
  
  /**
   * Automatically add participant names once we know who's in the meeting.
   * Helps with name recognition without having to know participants in advance.
   */
  addParticipantNamesToKeyterms() {
    if (state.participantRoster.size === 0) {
      return
    }
    
    const participantNames = Array.from(state.participantRoster.values())
      .filter(p => p.name && p.name !== state.botName && p.name !== 'Unknown' && p.name !== 'User')
      .map(p => p.name)
    
    if (participantNames.length > 0) {
      console.log(`[Assembly.ai RT] Adding ${participantNames.length} participant names as keyterms:`, participantNames.join(', '))
      
      // Add them to our existing keyterms (no duplicates)
      const existingKeyterms = new Set(this.keyterms)
      participantNames.forEach(name => existingKeyterms.add(name))
      
      this.keyterms = Array.from(existingKeyterms)
      console.log(`[Assembly.ai RT] Total keyterms: ${this.keyterms.length}`)
      
      // Note: This won't actually improve the current session since we can't update live
      // But it's here if we add reconnection logic in the future
    }
  }
}

export const assemblyAIRealtime = new AssemblyAIRealtime()