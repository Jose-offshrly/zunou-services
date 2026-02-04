/**
 * AI-powered transcript cleanup using OpenAI
 * Context-aware duplicate removal and sentence merging
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'
import axios from 'axios'
import { env } from './env.ts'

interface CleanupOptions {
  mode: 'aggressive' | 'balanced' | 'conservative'
  preserveTimestamps: boolean
  improveGrammar: boolean
  mergeSpeakers: boolean
  maxRetries: number
  timeout: number
}

const DEFAULT_OPTIONS: CleanupOptions = {
  mode: 'balanced',
  preserveTimestamps: true,
  improveGrammar: false,
  mergeSpeakers: false,
  maxRetries: 2,
  timeout: 30000 // 30 seconds
}

class AITranscriptCleaner {
  
  /**
   * Generate cleanup prompt based on mode
   */
  private generatePrompt(transcript: string, options: CleanupOptions): string {
    const baseInstructions = `You are a professional transcript editor. Clean up the following meeting transcript by:

1. **Fix progressive duplicates with speaker changes**: 
   - If the same content appears multiple times with different speakers, it's likely a speaker detection lag
   - Keep the FIRST speaker's attribution and FIRST timestamp
   - Use the most complete text version
   - Example: If lines 1-3 show "Esson: reading", "Malek: reading for", "Malek: reading for a few" → Keep as "Esson: reading for a few"

2. **Split out new content**:
   - If a line contains the duplicate content PLUS new additional content, split them
   - Keep the duplicate with the first speaker
   - Keep the new content as a separate line with the correct speaker
   - Example: "Malek: reading for a few [NEW CONTENT]" → Keep duplicate with Esson, keep new content with Malek

3. **Remove noise**: Filter out filler words, false starts, transcription artifacts ("thank you for watching")

4. **Merge incomplete fragments**: Only merge when same speaker and clearly same thought (within 3 seconds)

5. **Preserve chronology**: Keep events in chronological order

6. **Accurate attribution**: Use the FIRST speaker for progressive duplicates, not the last`

    const modeInstructions = {
      aggressive: `
- Be aggressive in removing redundant content
- Merge aggressively when sentences are clearly part of same thought
- Remove all filler words and hesitations
- Aim for maximum clarity and brevity`,
      
      balanced: `
- Balance between preserving original content and improving readability
- Only merge when clearly the same thought
- Keep important context even if slightly redundant
- Aim for natural, readable flow`,
      
      conservative: `
- Preserve as much original content as possible
- Only remove obvious duplicates and noise
- Be cautious with merging - keep separate unless clearly continuous
- Prioritize accuracy over readability`
    }

    const grammarInstructions = options.improveGrammar ? `
7. **Improve grammar**: Fix obvious grammar mistakes while preserving the speaker's intent and style` : ''

    const outputInstructions = options.preserveTimestamps ? `

**OUTPUT FORMAT**: Return the cleaned transcript in the EXACT same format:
[TIMESTAMP] Speaker Name: cleaned text

**CRITICAL RULES**:
- Keep the exact timestamp format: [2025-11-21T03:33:06.182Z]
- Keep the exact speaker names as they appear
- One entry per line
- No explanations, no markdown, just the cleaned transcript
- If a line should be removed, simply omit it
- If lines should be merged, combine under the earlier timestamp` : `

**OUTPUT FORMAT**: Return ONLY the cleaned transcript text, no timestamps. Format as:
Speaker Name: cleaned text`

    return `${baseInstructions}
${modeInstructions[options.mode]}${grammarInstructions}${outputInstructions}

**ORIGINAL TRANSCRIPT**:
${transcript}

**CLEANED TRANSCRIPT**:`
  }

  /**
   * Call OpenAI API to clean transcript
   */
  private async callOpenAI(prompt: string, options: CleanupOptions): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          {
            role: 'system',
            content: 'You are a professional transcript editor specializing in meeting transcripts. You maintain accuracy while improving readability.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 4000
        // Note: 'timeout' is not a valid OpenAI API parameter - only use in axios config below
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: options.timeout
      }
    )

    return response.data.choices[0].message.content.trim()
  }

  /**
   * Chunk large transcripts for processing
   */
  private chunkTranscript(content: string, maxLines: number = 100): string[] {
    const lines = content.split('\n').filter(line => line.trim())
    const chunks: string[] = []
    
    for (let i = 0; i < lines.length; i += maxLines) {
      const chunk = lines.slice(i, i + maxLines).join('\n')
      chunks.push(chunk)
    }
    
    return chunks
  }

  /**
   * Main cleanup function using AI
   */
  async cleanTranscript(
    inputPath: string,
    outputPath?: string,
    options: Partial<CleanupOptions> = {}
  ): Promise<string> {
    const fullOptions = { ...DEFAULT_OPTIONS, ...options }
    
    try {
      console.log(`🤖 Starting AI-powered transcript cleanup: ${inputPath}`)
      console.log(`   Mode: ${fullOptions.mode}`)
      console.log(`   Grammar improvement: ${fullOptions.improveGrammar ? 'ON' : 'OFF'}`)
      
      // Read original transcript
      const content = await readFile(inputPath, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      console.log(`📊 Original transcript: ${lines.length} lines`)
      
      // Check if transcript is too large and needs chunking
      const needsChunking = lines.length > 150
      let cleanedContent = ''
      
      if (needsChunking) {
        console.log(`📦 Large transcript detected - processing in chunks...`)
        const chunks = this.chunkTranscript(content, 100)
        const cleanedChunks: string[] = []
        
        for (let i = 0; i < chunks.length; i++) {
          console.log(`   Processing chunk ${i + 1}/${chunks.length}...`)
          const prompt = this.generatePrompt(chunks[i], fullOptions)
          
          let retries = 0
          let cleaned = ''
          
          while (retries <= fullOptions.maxRetries) {
            try {
              cleaned = await this.callOpenAI(prompt, fullOptions)
              break
            } catch (error) {
              retries++
              if (retries > fullOptions.maxRetries) {
                throw error
              }
              console.log(`   ⚠️ Retry ${retries}/${fullOptions.maxRetries}...`)
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
          
          cleanedChunks.push(cleaned)
        }
        
        cleanedContent = cleanedChunks.join('\n')
      } else {
        // Single pass for smaller transcripts
        console.log(`🤖 Processing entire transcript...`)
        const prompt = this.generatePrompt(content, fullOptions)
        
        let retries = 0
        while (retries <= fullOptions.maxRetries) {
          try {
            cleanedContent = await this.callOpenAI(prompt, fullOptions)
            break
          } catch (error) {
            retries++
            if (retries > fullOptions.maxRetries) {
              throw error
            }
            console.log(`⚠️ Retry ${retries}/${fullOptions.maxRetries}...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
      
      // Ensure there's actual content
      if (!cleanedContent || cleanedContent.length < 10) {
        throw new Error('AI returned empty or invalid transcript')
      }
      
      const cleanedLines = cleanedContent.split('\n').filter(line => line.trim())
      
      console.log(`✨ After AI cleanup: ${cleanedLines.length} lines`)
      console.log(`📉 Reduction: ${lines.length} → ${cleanedLines.length} lines (${Math.round((1 - cleanedLines.length / lines.length) * 100)}% reduction)`)
      
      // Save to output file
      const savePath = outputPath || inputPath.replace('.log', '_ai_cleaned.log')
      
      // Ensure directory exists before writing
      const dirPath = dirname(savePath)
      await mkdir(dirPath, { recursive: true })
      
      await writeFile(savePath, cleanedContent, 'utf-8')
      
      console.log(`✅ AI-cleaned transcript saved: ${savePath}`)
      
      return savePath
      
    } catch (error) {
      console.error('❌ Error in AI transcript cleanup:', error)
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error('⏱️ AI cleanup timed out - transcript may be too large')
        } else if (error.response?.status === 400) {
          console.error('❌ OpenAI Bad Request (400):')
          console.error('   Error details:', JSON.stringify(error.response?.data, null, 2))
          if (error.response?.data?.error?.message) {
            console.error('   Message:', error.response.data.error.message)
          }
        } else if (error.response?.status === 401) {
          console.error('🔑 OpenAI API key invalid or missing')
        } else if (error.response?.status === 429) {
          console.error('⏸️ OpenAI rate limit exceeded - try again later')
        } else if (error.response) {
          console.error(`❌ OpenAI API error (${error.response.status}):`)
          console.error('   Error details:', JSON.stringify(error.response?.data, null, 2))
        }
      }
      
      throw error
    }
  }

  /**
   * Compare AI cleanup with rule-based cleanup
   */
  async compareCleanupMethods(
    inputPath: string
  ): Promise<{
    original: number,
    ruleBased: number,
    aiBased: number,
    ruleBasedPath: string,
    aiBasedPath: string
  }> {
    console.log('📊 Comparing cleanup methods...\n')
    
    // Original
    const original = await readFile(inputPath, 'utf-8')
    const originalLines = original.split('\n').filter(l => l.trim()).length
    
    // Rule-based
    console.log('1️⃣ Running rule-based cleanup...')
    const { transcriptCleaner } = await import('./transcript-cleaner.ts')
    const ruleBasedPath = await transcriptCleaner.cleanTranscript(
      inputPath,
      inputPath.replace('.log', '_rule_cleaned.log')
    )
    const ruleBased = await readFile(ruleBasedPath, 'utf-8')
    const ruleBasedLines = ruleBased.split('\n').filter(l => l.trim()).length
    
    // AI-based
    console.log('\n2️⃣ Running AI-based cleanup...')
    const aiBasedPath = await this.cleanTranscript(
      inputPath,
      inputPath.replace('.log', '_ai_cleaned.log'),
      { mode: 'balanced' }
    )
    const aiBased = await readFile(aiBasedPath, 'utf-8')
    const aiBasedLines = aiBased.split('\n').filter(l => l.trim()).length
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 COMPARISON RESULTS')
    console.log('='.repeat(50))
    console.log(`Original:     ${originalLines} lines (100%)`)
    console.log(`Rule-based:   ${ruleBasedLines} lines (${Math.round(ruleBasedLines / originalLines * 100)}%)`)
    console.log(`AI-based:     ${aiBasedLines} lines (${Math.round(aiBasedLines / originalLines * 100)}%)`)
    console.log('='.repeat(50))
    
    return {
      original: originalLines,
      ruleBased: ruleBasedLines,
      aiBased: aiBasedLines,
      ruleBasedPath,
      aiBasedPath
    }
  }
}

// Export singleton
export const aiTranscriptCleaner = new AITranscriptCleaner()

