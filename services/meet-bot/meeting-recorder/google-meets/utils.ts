import assert from 'node:assert'


import { BOT_ID, SILENCE_THRESHOLD, ENABLE_FULL_AUDIO_ACCUMULATION } from './constants.ts'
import state, { type Page } from './state.ts'
import { stopMeetBot } from './stop_meet_bot.ts'
import audioProcessor from './audio-processor.ts'
import { assemblyAIRealtime } from './assemblyai-realtime.ts'

// Declare global interface for MeetBot state tracking
declare global {
  interface Window {
    MeetBotState?: {
      isTranscribing?: boolean
      lastTranscriptionTime?: number
    }
  }
}

let lastParticipantCheck = Date.now()

// Emergency shutdown flag
let isEmergencyShutdown = false

// Emergency page reference for immediate shutdown
let emergencyPageRef: Page | null = null

// Trigger emergency shutdown to prevent page operations
export function triggerEmergencyShutdown(reason: string = 'Unknown') {
  console.log(`🚨 [EMERGENCY SHUTDOWN] Triggered: ${reason}`)
  isEmergencyShutdown = true
  state.isBotRunning = false
  
  // If we have a page reference, immediately override all dangerous methods
  if (emergencyPageRef) {
    try {
      console.log(`🚫 [EMERGENCY] Disabling all page operations immediately`)
      
      // Override page.evaluate synchronously (but preserve Google Meet audio)
      const currentUrl = emergencyPageRef.url()
      const platform = detectMeetingPlatform(currentUrl)
      
      if (platform !== 'google-meet') {
        emergencyPageRef.evaluate = async function(...args: any[]): Promise<any> {
          console.log('🚫 [EMERGENCY] Blocked page.evaluate call - emergency shutdown active')
          return null
        }
      } else {
        console.log('🎵 [EMERGENCY] Preserving Google Meet page.evaluate for audio quality')
      }
      
      // Override other page methods that could trigger CDP calls (but preserve Google Meet)
      if (platform !== 'google-meet') {
        emergencyPageRef.$ = async function(...args: any[]): Promise<any> {
          console.log('🚫 [EMERGENCY] Blocked page.$ call - emergency shutdown active')
          return null
        }
        
        emergencyPageRef.$$ = async function(...args: any[]): Promise<any> {
          console.log('🚫 [EMERGENCY] Blocked page.$$ call - emergency shutdown active')
          return []
        }
        
        emergencyPageRef.click = async function(...args: any[]): Promise<any> {
          console.log('🚫 [EMERGENCY] Blocked page.click call - emergency shutdown active')
          return
        }
        
        emergencyPageRef.type = async function(...args: any[]): Promise<any> {
          console.log('🚫 [EMERGENCY] Blocked page.type call - emergency shutdown active')
          return
        }
        
        emergencyPageRef.waitForSelector = async function(...args: any[]): Promise<any> {
          console.log('🚫 [EMERGENCY] Blocked page.waitForSelector call - emergency shutdown active')
          return null
        }
      } else {
        console.log('🎵 [EMERGENCY] Preserving Google Meet page methods for audio quality')
      }
      
    } catch (error) {
      console.warn('⚠️ [EMERGENCY] Error during emergency page shutdown:', error)
    }
  }
}

// Reset emergency shutdown state between meetings
export function resetEmergencyShutdown() {
  if (isEmergencyShutdown) {
    console.log('Resetting emergency shutdown flag')
    isEmergencyShutdown = false
  }
}

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))
let previousSpeaker = ''

// ✅ **Audio Resampling**: Downsample audio from higher sample rates to 16kHz for Assembly.ai
function resampleAudio(audioBuffer: Buffer, fromRate: number, toRate: number = 16000): Buffer {
  if (fromRate === toRate) {
    return audioBuffer // No resampling needed
  }
  
  // Convert buffer to Int16Array (PCM 16-bit)
  const input = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2)
  
  // Calculate output length
  const ratio = toRate / fromRate
  const outputLength = Math.floor(input.length * ratio)
  const output = new Int16Array(outputLength)
  
  // Simple linear interpolation resampling
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i / ratio
    const srcIndexFloor = Math.floor(srcIndex)
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1)
    const fraction = srcIndex - srcIndexFloor
    
    // Linear interpolation between two samples
    const sample1 = input[srcIndexFloor]
    const sample2 = input[srcIndexCeil]
    output[i] = Math.round(sample1 + (sample2 - sample1) * fraction)
  }
  
  // Convert back to Buffer
  return Buffer.from(output.buffer, output.byteOffset, output.byteLength)
}

// Meeting platform detection
export type MeetingPlatform = 'google-meet' | 'teams' | 'zoom' | 'unknown'

// Transform Zoom URLs
export function transformZoomUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url
  }
  
  // Check if it's a Zoom URL with regional subdomain pattern (e.g., us04web.zoom.us/j/)
  const zoomRegionalPattern = /^(@?https?:\/\/)(us\d+web\.zoom\.us\/j\/)/i
  
  if (zoomRegionalPattern.test(url)) {
    // Replace regional subdomain pattern with standard zoom.us/wc/join/
    const transformedUrl = url.replace(zoomRegionalPattern, '$1zoom.us/wc/join/')
    console.log(`🔄 Transformed Zoom URL: ${url} → ${transformedUrl}`)
    return transformedUrl
  }
  
  return url
}

export function detectMeetingPlatform(meetUrl: string): MeetingPlatform {
  // Guard clause: handle undefined, null, or empty meetUrl
  if (!meetUrl || typeof meetUrl !== 'string') {
    console.error(`❌ Invalid meetUrl provided to detectMeetingPlatform: ${meetUrl}`)
    return 'unknown'
  }
  
  const url = meetUrl.toLowerCase()
  
  // Google Meet URL patterns
  if (url.includes('meet.google.com') || url.includes('meet.google.co')) {
    return 'google-meet'
  }
  
  // Microsoft Teams URL patterns (enhanced)
  if (url.includes('teams.microsoft.com') || 
      url.includes('teams.live.com') || 
      url.includes('teams.office.com') ||
      url.includes('teams.microsoft.us') ||
      url.includes('teams.gov.microsoft.us') ||
      url.includes('teams.microsoftonline.com') ||  // Additional Teams domain
      url.includes('/l/meetup-join/') ||             // Teams meeting invite pattern
      url.includes('/meet/') ||                      // Teams meeting pattern
      (url.includes('microsoft') && (url.includes('/teams/') || url.includes('teamsmeetings'))) ||
      url.match(/teams\.microsoft\.[a-z]{2,3}/) ||   // International Teams domains
      url.includes('broadcasting.teams.microsoft.com')) { // Teams Live Events
    return 'teams'
  }
  
  // Zoom URL patterns
  if (url.includes('zoom.us') || 
      url.includes('zoom.com') ||
      url.includes('zoom.') ||
      url.match(/us\d+web\.zoom\.us/) ||
      url.match(/\w+\.zoom\.us/) ||
      url.includes('/j/') && (url.includes('zoom') || url.match(/\d{9,11}/))) {
    return 'zoom'
  }
  
  return 'unknown'
}

// ✅ **Enhanced Audio Batch Processing with Advanced Audio Processing** (with dynamic sample rate)
export function batchAudioChunk(chunk: Uint8Array, sampleRate: number = 16000) {
  if (state.isBotPaused) {
    //console.log(`⏸️ [${BOT_ID}] Ignoring audio chunk during pause.`)
    return // Don't collect audio during pause
  }

  // ✅ **CRITICAL FIX: Allow audio for speaker detection even while waiting**
  // This enables the audio override in monitorKickout to detect when bot has joined
  // We'll skip transcription/storage but allow speaker detection
  const isWaitingForJoin = !state.hasJoined
  
  if (isWaitingForJoin) {
    // Log occasionally to show we're receiving audio while waiting
    if (Math.random() < 0.05) { // 5% chance
      console.log(`🎤 [${BOT_ID}] Receiving audio while waiting (for join detection): ${chunk.length} bytes`)
    }
    // Continue processing for speaker detection, don't return early!
  }

  // ✅ **Store current sample rate in state for forced transcriptions**
  state.currentAudioSampleRate = sampleRate

  // ✅ **Debug logging for audio chunk reception**
  if (!isWaitingForJoin && Math.random() < 0.1) { // 10% chance to log when debugging
    console.log(`🎵 [${BOT_ID}] Received audio chunk: ${chunk.length} bytes, sample rate: ${sampleRate} Hz, speaker: ${state.currentSpeaker}`)
  }

  const audioBuffer = Buffer.from(chunk)
  
  // ✅ **FIXED: Trust visual detection directly - it's updated every 500ms and is accurate**
  // selectSpeakerIntelligently() is only for fallback when visual detection has NO speakers
  const currentSpeaker = state.currentSpeaker || 'Unknown User'
  const speakerChanged = currentSpeaker !== previousSpeaker
  
  // NOTE: Speaker change logging moved to where speech is actually detected (below)
  // This prevents logging visual changes when there's no actual speech
  
  // Update roster activity if speaker is in roster
  if (state.participantRoster.has(currentSpeaker)) {
    const participant = state.participantRoster.get(currentSpeaker)!
    participant.lastActive = Date.now()
    participant.activityCount++
  }
  
  // Full Audio Accumulation Mode (alongside normal chunking)
  if (ENABLE_FULL_AUDIO_ACCUMULATION && state.isFullAccumulationMode) {
    const now = Date.now()
    
    // Update audio offset based on new audio chunk
    const chunkDurationMs = (audioBuffer.length / 2 / sampleRate) * 1000 // Convert bytes to ms using dynamic sample rate
    
    // 🚨 Memory safety check: Prevent accumulator from growing too large
    const memorySafetyLimit = 100 * 1024 * 1024 // 100MB safety limit
    const criticalMemoryLimit = 200 * 1024 * 1024 // 200MB critical limit
    
    if (state.fullAudioAccumulator.length > criticalMemoryLimit) {
      console.log(`🚨 CRITICAL: Audio accumulator exceeds ${Math.round(criticalMemoryLimit / 1024 / 1024)}MB, emergency reset to prevent OOM...`)
      // Emergency reset to prevent OOM - sacrifice accumulated audio to save the process
      const resetSizeMB = Math.round(state.fullAudioAccumulator.length / 1024 / 1024)
      state.fullAudioAccumulator = Buffer.alloc(0)
      state.currentAudioOffsetMs = 0
      state.speakerHistory = []
      
      // Force garbage collection if available
      if (global.gc) {
        console.log('🗑️ Emergency garbage collection triggered')
        global.gc()
      }
      
      console.log(`🚨 Emergency reset completed - ${resetSizeMB}MB buffer cleared`)
    } else if (state.fullAudioAccumulator.length > memorySafetyLimit) {
      // Warning but continue accumulating
      const currentSizeMB = Math.round(state.fullAudioAccumulator.length / 1024 / 1024)
      console.log(`⚠️ Audio accumulator size warning: ${currentSizeMB}MB (approaching limit)`)
    }
    
    // Accumulate all audio for end-of-meeting processing
    state.fullAudioAccumulator = Buffer.concat([state.fullAudioAccumulator, audioBuffer])
    
    // Track speakers who participate in the meeting
    if (currentSpeaker && currentSpeaker !== 'Unknown' && currentSpeaker !== 'User') {
      state.meetingSpeakers.add(currentSpeaker)
    }
    
    // Record speaker at regular intervals (every 2 seconds) or on speaker changes
    const shouldRecordSpeaker = (
      now - state.lastSpeakerUpdate > 2000 || // Every 2 seconds
      speakerChanged || // On speaker change
      state.speakerHistory.length === 0 // First recording
    )
    
    if (shouldRecordSpeaker && currentSpeaker) {
      state.speakerHistory.push({
        speaker: currentSpeaker,
        audioOffsetMs: state.currentAudioOffsetMs
      })
      state.lastSpeakerUpdate = now
      
      if (speakerChanged) {
        console.log(`🎤 Speaker at ${Math.round(state.currentAudioOffsetMs / 1000)}s: ${currentSpeaker}`)
      }
    }
    
    // Update current audio position
    state.currentAudioOffsetMs += chunkDurationMs
    
    // Periodic logging to show accumulation progress
    if (Math.random() < 0.001) { // ~0.1% chance to log stats
      const totalDurationMs = state.currentAudioOffsetMs
      const totalSizeMB = Math.round(state.fullAudioAccumulator.length / 1024 / 1024 * 100) / 100
      const speakerList = Array.from(state.meetingSpeakers).join(', ')
      console.log(`🎙️ Audio accumulation: ${Math.round(totalDurationMs / 1000)}s (${totalSizeMB}MB) buffered | Speakers: ${speakerList}`)
    }
  }
  
  // ✅ **ZOOM OPTIMIZATION**: Skip redundant audioProcessor for Zoom
  // Zoom uses Assembly.ai real-time exclusively, no need for legacy audio processor
  // Google Meet/Teams still use it for their specific processing needs
  const platform = state.meetingPlatform || 'google-meet'
  
  if (platform !== 'zoom') {
    // Continue with standard chunked processing for Google Meet/Teams
    // Use enhanced audio processor (with dynamic sample rate)
    const result = audioProcessor.processAudioChunk(audioBuffer, currentSpeaker, speakerChanged, sampleRate)
  }
  
  // ✅ **Assembly.ai Real-Time: Send RAW audio chunks continuously**
  // Assembly.ai requires continuous audio stream in 50-1000ms chunks
  // We send every incoming chunk (~60ms) directly, don't wait for processor batching
  // ✅ **ZOOM FIX**: Resample audio to 16kHz for Assembly.ai (which only accepts 16kHz)
  const resampledAudio = resampleAudio(audioBuffer, sampleRate, 16000)
  assemblyAIRealtime.sendAudio(resampledAudio, currentSpeaker, 16000)
  
  // Log occasionally to avoid spam (1% chance)
  if (Math.random() < 0.01) {
    const chunkDurationMs = Math.round((audioBuffer.length / 2 / sampleRate) * 1000)
    console.log(`🎙️ [${BOT_ID}] Sent ${audioBuffer.length} bytes (~${chunkDurationMs}ms) to Assembly.ai RT (speaker: ${currentSpeaker})`)
  }
  
  // Update previous speaker
  previousSpeaker = currentSpeaker
  
  // Log processing stats more frequently for debugging (commented out to reduce noise)
  // if (Math.random() < 0.05) { // ~5% chance to log stats
  //   const stats = audioProcessor.getStats()
  //   console.log(`📊 [${BOT_ID}] Audio processor stats: buffer=${stats.bufferDurationMs}ms, speech=${stats.isSpeechActive}, ratio=${stats.speechRatio}`)
  // }
}

// Helper delay function (uses the one defined at the top)

// Update getActiveSpeaker to capture the blue outline .tC2Wod
export async function getActiveSpeakers(page: Page): Promise<string[]> {
  if (page.isClosed()) {
    console.log(`🛑 [${BOT_ID}] getActiveSpeakers: Page is closed.`)
    return []
  }

  try {
    // Detect platform based on URL
    const currentUrl = page.url()
    const platform = detectMeetingPlatform(currentUrl)

    if (platform === 'google-meet') {
      return await getActiveSpeakersGoogleMeet(page)
    } else if (platform === 'teams') {
      return await getActiveSpeakersTeams(page)
    } else if (platform === 'zoom') {
      return await getActiveSpeakersZoom(page)
    } else {
      console.log(`⚠️ [${BOT_ID}] Unknown platform for speaker detection: ${platform}`)
      return []
    }
  } catch (error) {
    console.error(`❌ [${BOT_ID}] Error detecting active speakers:`, error)
    return []
  }
}

// ✅ **Google Meet Speaker Detection**
async function getActiveSpeakersGoogleMeet(page: Page): Promise<string[]> {
  const result = await page.evaluate((BOT_ID, botName) => {
    const detectedSpeakers = new Set<string>()

    // Select only `.tC2Wod` elements that are **active** (i.e., have `.kssMZb`)
    const activeElements = Array.from(
      document.querySelectorAll('.tC2Wod.kssMZb'),
    )

    console.log(
      `[${BOT_ID}] 🔍 SPEAKER DEBUG: Found ${activeElements.length} active speaker elements (.tC2Wod.kssMZb)`,
    )
    
    // ✅ **ENHANCED DIAGNOSTICS**: Always log what we're finding
    // If no active elements found, let's try broader selectors and log everything
    if (activeElements.length === 0) {
      console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: No .tC2Wod.kssMZb found, trying alternatives...`)
      
      // Try finding elements with just .kssMZb (might indicate active state)
      const kssMZbElements = Array.from(document.querySelectorAll('.kssMZb'))
      console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Found ${kssMZbElements.length} .kssMZb elements`)
      
      // Try finding ALL participant tiles to understand the structure
      const allTiles = Array.from(document.querySelectorAll('div[jsname="E2KThb"]'))
      console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Found ${allTiles.length} total participant tiles`)
      
      // Log first tile structure if available
      if (allTiles.length > 0) {
        const firstTile = allTiles[0]
        const nameSelectors = [
          { selector: 'span.notranslate', name: 'notranslate' },
          { selector: '.ne2Ple-oshW8e-V67aGc', name: 'ne2Ple' },
          { selector: '[data-self-name]', name: 'data-self-name' },
          { selector: '.KjwKEb', name: 'KjwKEb' },
          { selector: 'div[aria-label]', name: 'aria-label' },
        ]
        
        console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: First tile HTML:`, firstTile.innerHTML.substring(0, 200))
        
        nameSelectors.forEach(({selector, name}) => {
          const elem = firstTile.querySelector(selector)
          if (elem) {
            console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Found ${name}: "${elem.textContent?.substring(0, 50)}"`)
          }
        })
      }
      
      // Also try looking for any elements that might indicate speaking
      const possibleSpeakingElements = Array.from(document.querySelectorAll('[class*="kssMZb"]'))
      console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Found ${possibleSpeakingElements.length} elements with kssMZb in class`)
    }

    activeElements.forEach((outlineElement, index) => {
      // **Ensure it's VISIBLE on screen**
      const rect = outlineElement.getBoundingClientRect()
      const isVisible = rect.width > 0 && rect.height > 0

      console.log(`🔍 [${BOT_ID}] Checking speaker ${index + 1}:`, {
        isVisible,
        rect,
      })

      if (!isVisible) {
        console.log(`⚠️ [${BOT_ID}] Outline is not visible. Skipping.`)
        return
      }

      // Move up the DOM to find the closest participant tile (div[jsname="E2KThb"])
      const parentTile = outlineElement.closest('div[jsname="E2KThb"]')
      if (!parentTile) {
        console.log(`⚠️ [${BOT_ID}] No parent tile found for this speaker.`)
        return
      }

      console.log(`✅ [${BOT_ID}] Found parent participant tile:`, parentTile)

      // Extract the participant name from the tile - collect ALL candidates
      const nameSelectors = [
        'span.notranslate',
        '.ne2Ple-oshW8e-V67aGc',
        '[data-self-name]',
        '.KjwKEb',
        'div[aria-label]',
        '.zP5qcb',
        '.GvcuGe',
        '.zWfAib',
        '[data-tooltip]',
        '[title]',
        '[data-participant-id]',
        '.participant-name',
        '[data-name]',
        'span[dir="auto"]',
        'div[data-self-name]',
        '.smuKUc'
      ]
      
      const candidateNames: string[] = []
      
      // Collect all possible names from the tile
      for (const selector of nameSelectors) {
        const elem = parentTile.querySelector(selector)
        if (elem) {
          const name = elem.textContent || 
                      elem.getAttribute('aria-label') || 
                      elem.getAttribute('data-tooltip') || 
                      elem.getAttribute('title') || 
                      elem.getAttribute('data-self-name') || 
                      elem.getAttribute('data-name') || ''
          
          if (name && name.trim().length > 0) {
            candidateNames.push(name.trim())
          }
        }
      }
      
      // If no candidates from selectors, look at all text in tile
      if (candidateNames.length === 0) {
        const textElements = Array.from(parentTile.querySelectorAll('div, span'))
        for (const elem of textElements) {
          if (elem.textContent && elem.textContent.trim().length > 0 && elem.textContent.trim().length < 50) {
            candidateNames.push(elem.textContent.trim())
          }
        }
      }
      
      // Prioritize: Choose real name over "Unknown Speaker" label
      let speakerName = ''
      
      // First pass: Look for non-generic names
      for (const candidate of candidateNames) {
        const cleaned = candidate.replace(/\s*\(You\)/i, '').trim()
        if (cleaned && !/^unknown\s+speaker\s*\d*/i.test(cleaned)) {
          speakerName = cleaned
          console.log(`[${BOT_ID}] ✓ Preferring real name: "${speakerName}" over generic labels`)
          break
        }
      }
      
      // Second pass: If only generic names, use first candidate (will be filtered later)
      if (!speakerName && candidateNames.length > 0) {
        speakerName = candidateNames[0].replace(/\s*\(You\)/i, '').trim()
        console.log(`[${BOT_ID}] ⚠️ Only generic label available: "${speakerName}"`)
      }
      
      if (speakerName) {
        
        // Filter out UI text that isn't a real name
        const lower = speakerName.toLowerCase()
        const isValidName = speakerName && 
                          speakerName !== botName && 
                          !lower.includes('gemini') && 
                          !lower.includes('taking notes') && 
                          !lower.includes('transcript') &&
                          !lower.includes('captions') &&
                          !lower.includes('recording') &&
                          !lower.includes('camera') &&
                          !lower.includes('microphone') &&
                          !lower.includes('pin') &&
                          !lower.includes('unpin') &&
                          !lower.includes('more options') &&
                          !lower.includes('turn on') &&
                          !lower.includes('turn off') &&
                          !lower.includes('settings') &&
                          !lower.includes('menu') &&
                          !lower.includes('share your screen') &&
                          !lower.includes('not allowed') &&
                          !lower.includes('error') &&
                          !lower.includes('failed') &&
                          !lower.includes('denied') &&
                          !lower.includes('permission') &&
                          speakerName.length < 50 && 
                          speakerName.length > 1
        
        if (isValidName) {
          detectedSpeakers.add(speakerName)
          console.log(
            `🗣️ [${BOT_ID}] Active Speaker Detected: ${speakerName}`,
          )
        } else {
          console.log(
            `❌ [${BOT_ID}] Filtered out invalid speaker name: "${speakerName}" (length: ${speakerName.length}, lower: "${lower}")`,
          )
        }
      } else {
        console.log(
          `❌ [${BOT_ID}] No name element found inside the participant tile.`,
        )
      }
    })

    // If no active speakers found, try different approaches to find who's speaking
    if (detectedSpeakers.size === 0) {
      console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: No speakers detected via .tC2Wod.kssMZb, trying fallbacks...`)
      
      // Try approach 1: Look for any element with kssMZb class
      const kssMZbElements = Array.from(document.querySelectorAll('.kssMZb'))
      console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Trying ${kssMZbElements.length} .kssMZb elements`)
      
      for (const kssMZbElement of kssMZbElements) {
        const parentTile = kssMZbElement.closest('div[jsname="E2KThb"]')
        if (parentTile) {
          const notranslateSpan = parentTile.querySelector('span.notranslate')
          if (notranslateSpan && notranslateSpan.textContent) {
            const name = notranslateSpan.textContent.trim().replace(/\s*\(You\)/i, '').trim()
            if (name && name !== botName && name.length > 1 && name.length < 50) {
              detectedSpeakers.add(name)
              console.log(`🗣️ [${BOT_ID}] Active Speaker found via .kssMZb: ${name}`)
            }
          }
        }
      }
      
      // Try approach 2: If still no speakers, get ANY participant from the tiles
      if (detectedSpeakers.size === 0) {
        console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Still no speakers, trying to get ANY participant...`)
        const allTiles = Array.from(document.querySelectorAll('div[jsname="E2KThb"]'))
        
        for (const tile of allTiles) {
          // Try multiple selectors
          const nameElem = tile.querySelector('span.notranslate') || 
                          tile.querySelector('.ne2Ple-oshW8e-V67aGc') ||
                          tile.querySelector('[data-self-name]') ||
                          tile.querySelector('.KjwKEb')
          
          if (nameElem && nameElem.textContent) {
            const name = nameElem.textContent.trim().replace(/\s*\(You\)/i, '').trim()
            const lower = name.toLowerCase()
            
            if (name && name !== botName && name.length > 1 && name.length < 50 &&
                !lower.includes('gemini') && !lower.includes('transcript') && 
                !lower.includes('captions') && !lower.includes('recording')) {
              detectedSpeakers.add(name)
              console.log(`🗣️ [${BOT_ID}] Fallback: Found participant in tile: ${name}`)
              break // Just get one participant to use as default
            }
          }
        }
      }
    }

    console.log(`[${BOT_ID}] 🔍 SPEAKER DEBUG: Final detected speakers:`, Array.from(detectedSpeakers))
    return Array.from(detectedSpeakers)
  }, BOT_ID, state.botName)

  // Filter and clean detected speaker names
  const cleanedSpeakers = result
    .map(name => cleanParticipantName(name, state.botName))
    .filter((name): name is string => name !== null)
  
  if (cleanedSpeakers.length < result.length) {
    console.log(`🚫 [${BOT_ID}] Filtered out ${result.length - cleanedSpeakers.length} bot(s) from active speakers`)
    console.log(`   Raw: ${result.join(', ')}`)
    console.log(`   Cleaned: ${cleanedSpeakers.join(', ')}`)
  }
  
  return cleanedSpeakers
}

// ✅ **Microsoft Teams Speaker Detection**
async function getActiveSpeakersTeams(page: Page): Promise<string[]> {
  try {
    const result = await safePageEvaluate<string[]>(page, (BOT_ID: string, botName: string) => {
      const detectedSpeakers = new Set<string>()

      // Helper function to check if text is a UI element (not a real name)
      function isUIElement(text: string): boolean {
        const lower = text.toLowerCase()
        const uiElements = [
          'raise', 'react', 'view', 'mic', 'mute', 'unmute',
          'camera', 'video', 'share', 'screen', 'leave', 'end',
          'settings', 'more', 'options', 'background', 'effects',
          'device', 'audio', 'chat', 'participants', 'join',
          'call', 'meeting', 'teams', 'microsoft', 'hang up',
          'people', 'roster', 'gallery', 'speaker', 'layout',
          'record', 'stop', 'start', 'blur', 'replace', 'remove',
          'turn on', 'turn off', 'enable', 'disable', 'open',
          'close', 'minimize', 'maximize', 'full screen', 'exit',
          'hand', 'raised', 'lower', 'pin', 'unpin', 'spotlight',
          'together mode', 'large gallery', 'focus mode',
          'breakout rooms', 'lobby', 'admit', 'deny', 'waiting'
        ]
        
        return uiElements.some(uiElement => 
          lower.includes(uiElement) || 
          lower === uiElement ||
          text.length < 2 ||
          text.length > 50
        )
      }

      // Extract clean participant name
      function extractParticipantName(text: string): string | null {
        if (!text) return null
        
        // Remove "(you)" suffix and common Teams indicators
        let cleanText = text.replace(/\s*\(you\)\s*$/i, '').trim()
        cleanText = cleanText.replace(/\s*\(presenter\)\s*/i, '').trim()
        cleanText = cleanText.replace(/\s*\(organizer\)\s*/i, '').trim()
        
        // Split concatenated names (like "Pulse CompanionLouiejie Arañes")
        // Look for pattern: "BotName + UserName" and extract UserName
        if (cleanText.includes(botName)) {
          cleanText = cleanText.replace(botName, '').trim()
        }
        
        // If still has spaces, might be "FirstName LastName"
        if (cleanText && !isUIElement(cleanText) && cleanText.length > 1) {
          return cleanText
        }
        
        return null
      }

      

      // Strategy 1: Look for active audio/video indicators
      const audioVisualIndicators = [
        // Audio wave/voice activity animations
        '[class*="audio-indicator"]',
        '[class*="voice-indicator"]', 
        '[class*="speaking"]',
        '[class*="voice-active"]',
        '[class*="audio-active"]',
        '[class*="sound-wave"]',
        '[class*="audio-wave"]',
        '[class*="voice-activity"]',
        '[class*="mic-active"]',
        '[class*="microphone-active"]',
        // Video tile emphasis
        '[class*="active-speaker"]',
        '[class*="dominant-speaker"]',
        '[class*="current-speaker"]',
        '[class*="highlighted"]',
        '[class*="emphasized"]',
        '[class*="focused"]',
        // Common Teams selectors
        '[data-tid*="speaking"]',
        '[data-tid*="audio-active"]',
        '[data-tid*="voice"]',
        '[aria-label*="speaking"]',
        '[aria-label*="voice"]',
        '[aria-label*="audio active"]',
        // CSS animations often used for speaking
        '[style*="animation"]',
        '[style*="transform"]'
      ]

      
      
      for (const selector of audioVisualIndicators) {
        try {
          const elements = Array.from(document.querySelectorAll(selector))
          
          
          elements.forEach((element, index) => {
            // Check if element is visible and potentially active
            const computedStyle = window.getComputedStyle(element)
            const isVisible = computedStyle.display !== 'none' && 
                             computedStyle.visibility !== 'hidden' &&
                             computedStyle.opacity !== '0'
            
            if (isVisible) {
              // Look for names in this element and nearby elements
              const searchElements = [element, element.parentElement, ...Array.from(element.children)]
              
              searchElements.forEach((searchEl) => {
                if (searchEl) {
                  const text = searchEl.textContent?.trim()
                  const ariaLabel = searchEl.getAttribute('aria-label')
                  const title = searchEl.getAttribute('title')
                  
                  const contents = [text, ariaLabel, title].filter((content): content is string => 
                    content !== null && content !== undefined && content.trim().length > 0
                  )
                  
                  contents.forEach((content) => {
                    const name = extractParticipantName(content)
                    if (name) {
 
                      detectedSpeakers.add(name)
                    }
                  })
                }
              })
            }
          })
        } catch (error) {
                      // Selector failed, continue to next
        }
      }

      // Strategy 2: Look for participant tiles with visual emphasis (borders, shadows, etc.)
      const participantTileSelectors = [
        '[data-tid*="participant"]',
        '[data-tid*="video-tile"]', 
        '[data-tid*="audio-tile"]',
        '[data-tid*="member"]',
        '[class*="participant"]',
        '[class*="video-tile"]',
        '[class*="member-tile"]',
        '[class*="user-tile"]',
        '[class*="avatar"]'
      ]

      
      
      participantTileSelectors.forEach((selector) => {
        try {
          const tiles = Array.from(document.querySelectorAll(selector))
          
          
          tiles.forEach((tile) => {
            const computedStyle = window.getComputedStyle(tile)
            
            // Check for visual indicators of active speaking
            const hasActiveBorder = (
              computedStyle.borderWidth !== '0px' && 
              computedStyle.borderWidth !== '' &&
              !computedStyle.borderColor.includes('rgba(0, 0, 0, 0)') &&
              computedStyle.borderColor !== 'transparent'
            )
            
            const hasBoxShadow = computedStyle.boxShadow !== 'none'
            const hasTransform = computedStyle.transform !== 'none'
            const hasAnimation = computedStyle.animationName !== 'none'
            const hasHighlight = !computedStyle.backgroundColor.includes('rgba(0, 0, 0, 0)') &&
                                computedStyle.backgroundColor !== 'transparent'
            
            const isVisuallyEmphasized = hasActiveBorder || hasBoxShadow || hasTransform || hasAnimation || hasHighlight
            
            if (isVisuallyEmphasized) {
              // Found visually emphasized tile
              
              // Extract name from this emphasized tile
              const tileText = tile.textContent?.trim()
              const tileAriaLabel = tile.getAttribute('aria-label')
              
              const tileContents = [tileText, tileAriaLabel].filter((content): content is string => 
                content !== null && content !== undefined && content.trim().length > 0
              )
              
              tileContents.forEach((content) => {
                const name = extractParticipantName(content)
                if (name) {

                  detectedSpeakers.add(name)
                }
              })
            }
          })
        } catch (error) {
                      // Tile selector failed, continue
        }
      })

      // Strategy 3: Look for recent activity or "now speaking" indicators
      const recentActivitySelectors = [
        '[aria-live="polite"]',
        '[aria-live="assertive"]',
        '[class*="recent"]',
        '[class*="current"]',
        '[class*="now"]',
        '[class*="active"]',
        '[data-tid*="current"]',
        '[data-tid*="active"]'
      ]

      
      
      recentActivitySelectors.forEach((selector) => {
        try {
          const elements = Array.from(document.querySelectorAll(selector))
          elements.forEach((element) => {
            const text = element.textContent?.trim()
            if (text && (text.includes('speaking') || text.includes('talking'))) {

              const name = extractParticipantName(text)
              if (name) {
                
                detectedSpeakers.add(name)
              }
            }
          })
        } catch (error) {
                      // Activity selector failed, continue
        }
      })

      // Strategy 4: Look for "(you)" patterns as fallback
      if (detectedSpeakers.size === 0) {

        
        const youElements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent?.includes('(you)'))
        
        
        
        youElements.forEach((el) => {
          const text = el.textContent?.trim()
          if (text) {
            const name = extractParticipantName(text)
            if (name) {

              detectedSpeakers.add(name)
            }
          }
        })
      }

      const finalSpeakers = Array.from(detectedSpeakers).filter(name => 
        name && name !== botName && !isUIElement(name)
      )
      
      
      return finalSpeakers
    }, BOT_ID, state.botName)

    // Only log when we find speakers or when there's a change
    if (result && result.length > 0) {
      console.log(`🔍 [${BOT_ID}] Teams active speakers detected: ${result.join(', ')}`)
    }
    
    return result || []
  } catch (error) {
    console.error(`❌ [${BOT_ID}] Error in Teams speaker detection:`, error)
    return []
  }
}

// ✅ **Zoom Speaker Detection**
async function getActiveSpeakersZoom(page: Page): Promise<string[]> {
  try {
    const result = await safePageEvaluate<string[]>(page, (BOT_ID: string, botName: string) => {
      const detectedSpeakers = new Set<string>()

      // Helper function to check if text is a UI element (not a real name)
      function isUIElement(text: string): boolean {
        const lower = text.toLowerCase()
        const uiElements = [
          'raise', 'react', 'view', 'mic', 'mute', 'unmute',
          'camera', 'video', 'share', 'screen', 'leave', 'end',
          'settings', 'more', 'options', 'background', 'effects',
          'device', 'audio', 'chat', 'participants', 'join',
          'call', 'meeting', 'teams', 'microsoft', 'hang up',
          'people', 'roster', 'gallery', 'speaker', 'layout',
          'record', 'stop', 'start', 'blur', 'replace', 'remove',
          'turn on', 'turn off', 'enable', 'disable', 'open',
          'close', 'minimize', 'maximize', 'full screen', 'exit',
          'hand', 'raised', 'lower', 'pin', 'unpin', 'spotlight',
          'together mode', 'large gallery', 'focus mode',
          'breakout rooms', 'lobby', 'admit', 'deny', 'waiting'
        ]
        
        return uiElements.some(uiElement => 
          lower.includes(uiElement) || 
          lower === uiElement ||
          text.length < 2 ||
          text.length > 50
        )
      }

      // Extract clean participant name
      function extractParticipantName(text: string): string | null {
        if (!text) return null
        
        // Remove "(you)" suffix and common Zoom indicators
        let cleanText = text.replace(/\s*\(you\)\s*$/i, '').trim()
        cleanText = cleanText.replace(/\s*\(presenter\)\s*/i, '').trim()
        cleanText = cleanText.replace(/\s*\(organizer\)\s*/i, '').trim()
        
        // Split concatenated names (like "Pulse CompanionLouiejie Arañes")
        // Look for pattern: "BotName + UserName" and extract UserName
        if (cleanText.includes(botName)) {
          cleanText = cleanText.replace(botName, '').trim()
        }
        
        // If still has spaces, might be "FirstName LastName"
        if (cleanText && !isUIElement(cleanText) && cleanText.length > 1) {
          return cleanText
        }
        
        return null
      }

      

      // Strategy 1: Look for active audio/video indicators
      const audioVisualIndicators = [
        // Audio wave/voice activity animations
        '[class*="audio-indicator"]',
        '[class*="voice-indicator"]', 
        '[class*="speaking"]',
        '[class*="voice-active"]',
        '[class*="audio-active"]',
        '[class*="sound-wave"]',
        '[class*="audio-wave"]',
        '[class*="voice-activity"]',
        '[class*="mic-active"]',
        '[class*="microphone-active"]',
        // Video tile emphasis
        '[class*="active-speaker"]',
        '[class*="dominant-speaker"]',
        '[class*="current-speaker"]',
        '[class*="highlighted"]',
        '[class*="emphasized"]',
        '[class*="focused"]',
        // Common Zoom selectors
        '[data-tid*="speaking"]',
        '[data-tid*="audio-active"]',
        '[data-tid*="voice"]',
        '[aria-label*="speaking"]',
        '[aria-label*="voice"]',
        '[aria-label*="audio active"]',
        // CSS animations often used for speaking
        '[style*="animation"]',
        '[style*="transform"]'
      ]

      
      
      for (const selector of audioVisualIndicators) {
        try {
          const elements = Array.from(document.querySelectorAll(selector))
          
          
          elements.forEach((element, index) => {
            // Check if element is visible and potentially active
            const computedStyle = window.getComputedStyle(element)
            const isVisible = computedStyle.display !== 'none' && 
                             computedStyle.visibility !== 'hidden' &&
                             computedStyle.opacity !== '0'
            
            if (isVisible) {
              // Look for names in this element and nearby elements
              const searchElements = [element, element.parentElement, ...Array.from(element.children)]
              
              searchElements.forEach((searchEl) => {
                if (searchEl) {
                  const text = searchEl.textContent?.trim()
                  const ariaLabel = searchEl.getAttribute('aria-label')
                  const title = searchEl.getAttribute('title')
                  
                  const contents = [text, ariaLabel, title].filter((content): content is string => 
                    content !== null && content !== undefined && content.trim().length > 0
                  )
                  
                  contents.forEach((content) => {
                    const name = extractParticipantName(content)
                    if (name) {
 
                      detectedSpeakers.add(name)
                    }
                  })
                }
              })
            }
          })
        } catch (error) {
                      // Selector failed, continue to next
        }
      }

      // Strategy 2: Look for participant tiles with visual emphasis (borders, shadows, etc.)
      const participantTileSelectors = [
        '[data-tid*="participant"]',
        '[data-tid*="video-tile"]', 
        '[data-tid*="audio-tile"]',
        '[data-tid*="member"]',
        '[class*="participant"]',
        '[class*="video-tile"]',
        '[class*="member-tile"]',
        '[class*="user-tile"]',
        '[class*="avatar"]'
      ]

      
      
      participantTileSelectors.forEach((selector) => {
        try {
          const tiles = Array.from(document.querySelectorAll(selector))
          
          
          tiles.forEach((tile) => {
            const computedStyle = window.getComputedStyle(tile)
            
            // Check for visual indicators of active speaking
            const hasActiveBorder = (
              computedStyle.borderWidth !== '0px' && 
              computedStyle.borderWidth !== '' &&
              !computedStyle.borderColor.includes('rgba(0, 0, 0, 0)') &&
              computedStyle.borderColor !== 'transparent'
            )
            
            const hasBoxShadow = computedStyle.boxShadow !== 'none'
            const hasTransform = computedStyle.transform !== 'none'
            const hasAnimation = computedStyle.animationName !== 'none'
            const hasHighlight = !computedStyle.backgroundColor.includes('rgba(0, 0, 0, 0)') &&
                                computedStyle.backgroundColor !== 'transparent'
            
            const isVisuallyEmphasized = hasActiveBorder || hasBoxShadow || hasTransform || hasAnimation || hasHighlight
            
            if (isVisuallyEmphasized) {
              // Found visually emphasized tile
              
              // Extract name from this emphasized tile
              const tileText = tile.textContent?.trim()
              const tileAriaLabel = tile.getAttribute('aria-label')
              
              const tileContents = [tileText, tileAriaLabel].filter((content): content is string => 
                content !== null && content !== undefined && content.trim().length > 0
              )
              
              tileContents.forEach((content) => {
                const name = extractParticipantName(content)
                if (name) {

                  detectedSpeakers.add(name)
                }
              })
            }
          })
        } catch (error) {
                      // Tile selector failed, continue
        }
      })

      // Strategy 3: Look for recent activity or "now speaking" indicators
      const recentActivitySelectors = [
        '[aria-live="polite"]',
        '[aria-live="assertive"]',
        '[class*="recent"]',
        '[class*="current"]',
        '[class*="now"]',
        '[class*="active"]',
        '[data-tid*="current"]',
        '[data-tid*="active"]'
      ]

      
      
      recentActivitySelectors.forEach((selector) => {
        try {
          const elements = Array.from(document.querySelectorAll(selector))
          elements.forEach((element) => {
            const text = element.textContent?.trim()
            if (text && (text.includes('speaking') || text.includes('talking'))) {

              const name = extractParticipantName(text)
              if (name) {
                
                detectedSpeakers.add(name)
              }
            }
          })
        } catch (error) {
                      // Activity selector failed, continue
        }
      })

      // Strategy 4: Look for "(you)" patterns as fallback
      if (detectedSpeakers.size === 0) {

        
        const youElements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.textContent?.includes('(you)'))
        
        
        
        youElements.forEach((el) => {
          const text = el.textContent?.trim()
          if (text) {
            const name = extractParticipantName(text)
            if (name) {

              detectedSpeakers.add(name)
            }
          }
        })
      }

      const finalSpeakers = Array.from(detectedSpeakers).filter(name => 
        name && name !== botName && !isUIElement(name)
      )
      
      
      return finalSpeakers
    }, BOT_ID, state.botName)

    // Only log when we find speakers or when there's a change
    if (result && result.length > 0) {
      console.log(`🔍 [${BOT_ID}] Zoom active speakers detected: ${result.join(', ')}`)
    }
    
    return result || []
  } catch (error) {
    console.error(`❌ [${BOT_ID}] Error in Zoom speaker detection:`, error)
    return []
  }
}

// ✅ **Extract Names from Recent Transcriptions**
function extractNamesFromTranscript(transcriptLog: string[]): string[] {
  const names = new Set<string>()
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'you', 'we', 'they', 'it', 'he', 'she', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    'good', 'morning', 'evening', 'afternoon', 'hello', 'hi', 'hey', 'thanks', 'thank', 'sure',
    'okay', 'yes', 'no', 'right', 'left', 'up', 'down', 'perfect', 'great', 'nice', 'well'
  ])
  
  // ✅ **ENHANCED: More comprehensive name extraction patterns**
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
  
  transcriptLog.forEach(line => {
    // Extract the text part after the speaker prefix (if present)
    // Format is typically: "[timestamp] Speaker: text"
    const textMatch = line.match(/\] (?:[^:]+: )?(.+)$/)
    const text = textMatch ? textMatch[1] : line
    
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern)
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
          console.log(`📝 [${BOT_ID}] Extracted name from transcript: "${name}"`)
        }
      }
    })
  })
  
  const result = Array.from(names)
  if (result.length > 0) {
    console.log(`📝 [${BOT_ID}] Total unique names extracted: ${result.length}`, result)
  }
  return result
}

// ✅ **Try to Open Participants Panel**
async function ensureParticipantsPanelOpen(page: Page): Promise<boolean> {
  try {
    const result = await safePageEvaluate<{opened: boolean; panelFound: boolean; buttonFound: string | null}>(page, (BOT_ID: string) => {
      console.log(`[${BOT_ID}] 🔍 Checking participants panel state...`)
      
      // First check if panel is already open
      const panelSelectors = [
        '[aria-label*="participant" i][role="list"]',
        '[aria-label*="people" i][role="list"]',
        '[data-panel-id="people"]',
        '.participant-list:not(:empty)',
        '[role="complementary"] [role="list"]'
      ]
      
      for (const panelSelector of panelSelectors) {
        const panel = document.querySelector(panelSelector)
        if (panel) {
          const itemCount = panel.querySelectorAll('[role="listitem"]').length
          console.log(`[${BOT_ID}] ✅ Panel already open (${panelSelector}), ${itemCount} items`)
          return {opened: true, panelFound: true, buttonFound: null}
        }
      }
      
      console.log(`[${BOT_ID}] 🔍 Panel not open, attempting to open...`)
      
      // Try to find and click the "Show everyone" or participants button
      const buttonSelectors = [
        'button[aria-label*="people" i]',
        'button[aria-label*="participant" i]',
        'button[aria-label*="Show everyone" i]',
        '[data-tooltip*="people" i]',
        '[data-tooltip*="participant" i]',
        'button[jsname="A5Il2c"]', // Google Meet people button
        'button i[data-icon-name="people"]',
        'button i[aria-label*="people" i]',
        '[aria-label*="Show participants"]'
      ]
      
      console.log(`[${BOT_ID}] 🔍 Trying ${buttonSelectors.length} button selectors...`)
      
      for (const selector of buttonSelectors) {
        const button = document.querySelector(selector) as HTMLElement
        if (button) {
          const buttonLabel = button.getAttribute('aria-label') || button.getAttribute('data-tooltip') || 'unknown'
          console.log(`[${BOT_ID}] ✅ Found participants button: ${selector} (label: ${buttonLabel})`)
          
          try {
            button.click()
            console.log(`[${BOT_ID}] ✅ Clicked participants button`)
            return {opened: true, panelFound: false, buttonFound: selector}
          } catch (e) {
            console.log(`[${BOT_ID}] ⚠️ Error clicking button: ${e}`)
          }
        }
      }
      
      console.log(`[${BOT_ID}] ❌ Could not find participants button`)
      console.log(`[${BOT_ID}] 📋 Available buttons:`)
      const allButtons = document.querySelectorAll('button[aria-label], button[data-tooltip]')
      allButtons.forEach((btn, i) => {
        if (i < 10) { // Log first 10 buttons
          const label = btn.getAttribute('aria-label') || btn.getAttribute('data-tooltip')
          console.log(`[${BOT_ID}]   - Button ${i+1}: ${label}`)
        }
      })
      
      return {opened: false, panelFound: false, buttonFound: null}
    }, BOT_ID)
    
    if (result?.opened) {
      // Wait for the panel to fully render
      const waitTime = result.panelFound ? 500 : 1500 // Less wait if already open
      await new Promise(resolve => setTimeout(resolve, waitTime))
      console.log(`✅ [${BOT_ID}] Participants panel is open (button: ${result.buttonFound || 'already-open'})`)
      return true
    } else {
      console.log(`⚠️ [${BOT_ID}] Could not open participants panel`)
    }
  } catch (error) {
    console.log(`⚠️ [${BOT_ID}] Error opening participants panel:`, error)
  }
  
  return false
}

// ✅ **Clean and Filter Participant Names**
function cleanParticipantName(rawName: string, botName: string): string | null {
  if (!rawName) return null
  
  let name = rawName.trim()
  const originalName = name // Keep for logging
  
  // Filter out bot names and recording services
  const botKeywords = [
    'fireflies',
    'notetaker',
    'companion',
    'bot',
    'recorder',
    'meeting bot',
    'zoom bot',
    'meet bot',
    'otter',
    'grain',
    'avoma',
    'gong',
    'chorus',
    'clari',
    'AI notetaker',
    'recording',
  ]
  
  const lowerName = name.toLowerCase()
  if (botKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
    return null // This is a bot, exclude it
  }
  
  // ✅ **FIXED: More robust suffix removal**
  // Remove common suffixes that Google Meet adds (in order of specificity)
  const suffixesToRemove = [
    ' Meeting host',
    ' meeting host',
    'domain_disabled',  // This can appear without space (e.g., "MCRdomain_disabled")
    ' domain disabled',
    'domain disabled',
    ' Visitor',
    ' visitor',
    ' Guest',
    ' guest',
    ' (You)',
    ' (you)',
    '(You)',
    '(you)',
    ' (Host)',
    ' (host)',
    '(Host)',
    '(host)',
  ]
  
  // ✅ **FIXED: Remove ALL suffixes, not just first one**
  // Keep looping until no more suffixes found
  let cleaned = false
  let previousName = ''
  let iterations = 0
  const maxIterations = 10 // Prevent infinite loops
  
  while (previousName !== name && iterations < maxIterations) {
    previousName = name
    iterations++
  
  for (const suffix of suffixesToRemove) {
      const lowerSuffix = suffix.toLowerCase()
      const lowerName = name.toLowerCase()
      
      if (lowerName.endsWith(lowerSuffix)) {
        // ✅ Use the actual matched suffix length from lowerName
        name = name.substring(0, name.length - lowerSuffix.length).trim()
        cleaned = true
        break // Break inner loop to restart from beginning with new name
      }
    }
  }
  
  // Second pass: Handle special cases with regex for any position
  const specialPatterns = [
    /domain_disabled/gi,
    /domain\s+disabled/gi,
    /Meeting\s+host/gi,
    /meeting\s+host/gi,
    /Visitor/gi,
    /visitor/gi,
  ]
  
  for (const pattern of specialPatterns) {
    if (pattern.test(name)) {
      name = name.replace(pattern, '').trim()
      cleaned = true
    }
  }
  
  // Log cleaning if name changed
  if (cleaned && name !== originalName) {
    console.log(`🧹 [${BOT_ID}] Cleaned participant name: "${originalName}" → "${name}"`)
  }
  
  // Filter out if it's the bot itself
  if (name === botName || name.includes(botName)) {
    return null
  }
  
  // Filter out empty or too short names
  if (name.length < 2 || name.length > 50) {
    return null
  }
  
  // Filter out obvious UI elements or generic terms
  const invalidNames = ['mute', 'unmute', 'unknown', 'user', 'domain', 'disabled']
  const checkLower = name.toLowerCase()
  if (invalidNames.some(invalid => checkLower === invalid)) {
    return null
  }
  
  // Filter out generic "Unknown Speaker N" labels from Google Meet
  // These appear when Meet can't identify someone (no camera, off-screen tile, etc.)
  // We only want real participant names in the roster
  if (/^unknown\s+speaker\s*\d*/i.test(name)) {
    console.log(`🚫 [${BOT_ID}] Filtered out generic label: "${name}" (not a real participant name)`)
    return null
  }
  
  return name
}

// ✅ **Force Open Participant Panel to Get ALL Names**
export async function openParticipantPanel(page: Page): Promise<boolean> {
  try {
    console.log('🔍 [BOT] Attempting to open participant panel to capture all names...')
    
    // Try multiple selectors for the "People" / "Participants" button
    const peopleButtonSelectors = [
      'button[aria-label*="people" i]',
      'button[aria-label*="participant" i]',
      '[data-panel-id="people"]',
      'button[jsname="A5il2e"]', // Google Meet people button
      'div[aria-label*="people" i]',
      'i[aria-label*="people" i]'
    ]
    
    for (const selector of peopleButtonSelectors) {
      try {
        const button = await page.$(selector)
        if (button) {
          console.log(`✅ [BOT] Found people button: ${selector}`)
          await button.click()
          await delay(2000) // Wait for panel to open
          console.log(`✅ [BOT] Participant panel opened`)
          return true
        }
      } catch (err) {
        // Try next selector
      }
    }
    
    console.log('⚠️ [BOT] Could not find participant panel button')
    return false
  } catch (error) {
    console.error('❌ [BOT] Error opening participant panel:', error)
    return false
  }
}

// ✅ **Build Comprehensive Participant Roster**
export async function buildParticipantRoster(page: Page, openPanel: boolean = false): Promise<Map<string, { name: string; lastActive: number; activityCount: number }>> {
  const roster = new Map()
  
  // Try to open participant panel first if requested
  if (openPanel) {
    await openParticipantPanel(page)
  }
  
  try {
    const participants = await safePageEvaluate<Array<{ name: string; element: string }>>(page, (BOT_ID: string, botName: string) => {
      const found: Array<{ name: string; element: string }> = []
      
      console.log(`[${BOT_ID}] 📋 Building participant roster...`)
      console.log(`[${BOT_ID}] 📋 Document ready state: ${document.readyState}`)
      console.log(`[${BOT_ID}] 📋 Page body children: ${document.body.childElementCount}`)
      
      // ✅ **ENHANCED: Try multiple strategies to find participant tiles**
      
      // Strategy 1: Get ALL participant tiles using primary selector
      let tiles = Array.from(document.querySelectorAll('div[jsname="E2KThb"]'))
      console.log(`[${BOT_ID}] 📋 Strategy 1: Found ${tiles.length} participant tiles (div[jsname="E2KThb"])`)
      
      // Strategy 2: If no tiles found, try finding grid/gallery containers first
      if (tiles.length === 0) {
        console.log(`[${BOT_ID}] 📋 Strategy 2: Looking for grid/gallery containers...`)
        const gridSelectors = [
          'div[data-self-name]',  // Sometimes the name is on the container itself
          '[data-participant-id]',
          'div[jscontroller*="participant"]',
          'div[aria-label*="participant" i]',
          'div[class*="participant"]',
          'div[class*="tile"]'
        ]
        
        for (const selector of gridSelectors) {
          const elems = document.querySelectorAll(selector)
          console.log(`[${BOT_ID}] 📋   Trying ${selector}: ${elems.length} elements`)
          if (elems.length > 0) {
            tiles = Array.from(elems) as HTMLElement[]
            console.log(`[${BOT_ID}] 📋   ✅ Using ${tiles.length} tiles from ${selector}`)
            break
          }
        }
      }
      
      // Strategy 3: Look for any elements with participant names directly
      if (tiles.length === 0) {
        console.log(`[${BOT_ID}] 📋 Strategy 3: Looking for name elements directly...`)
        const nameElements = document.querySelectorAll('span.notranslate, [data-self-name], .ne2Ple-oshW8e-V67aGc')
        console.log(`[${BOT_ID}] 📋   Found ${nameElements.length} potential name elements`)
        
        nameElements.forEach(elem => {
          const name = elem.textContent || elem.getAttribute('data-self-name') || ''
          if (name && name.trim().length > 0) {
            console.log(`[${BOT_ID}] 📋   Direct name element: "${name}"`)
          }
        })
      }
      
      for (const tile of tiles) {
        // Try multiple name selectors in priority order
        const selectors = [
          'span.notranslate',           // Most reliable
          '.ne2Ple-oshW8e-V67aGc',      // Common name class
          '[data-self-name]',            // Data attribute
          '.KjwKEb',                     // Alternative name class
          '[data-participant-id]',       // Participant ID container
          '.participant-name',           // Generic class
          '[data-name]',                 // Data attribute
          'div[aria-label]',             // ARIA labels
          '.zP5qcb',                     // Old class
          '.GvcuGe',                     // Old class
          '.zWfAib',                     // Old class
          '[data-tooltip]',              
          '[title]',
          'span[dir="auto"]',            // Auto-direction spans (often names)
        ]
        
        let foundName = false
        let candidateNames: Array<{ name: string; selector: string }> = []
        
        // Collect ALL possible names from this tile
        for (const selector of selectors) {
          const elem = tile.querySelector(selector)
          if (elem) {
            let name = elem.textContent || 
                       elem.getAttribute('data-self-name') || 
                       elem.getAttribute('data-tooltip') || 
                       elem.getAttribute('aria-label') || 
                       elem.getAttribute('data-name') || ''
            
            name = name.trim().replace(/\s*\(You\)/i, '').trim()
            
            if (name && name !== botName && name.length > 1 && name.length < 50) {
              const lower = name.toLowerCase()
              const isValid = !lower.includes('gemini') && 
                             !lower.includes('transcript') &&
                             !lower.includes('captions') &&
                             !lower.includes('recording') &&
                             !lower.includes('camera') &&
                             !lower.includes('microphone') &&
                             !lower.includes('pin') &&
                             !lower.includes('unpin') &&
                             !lower.includes('more options') &&
                             !lower.includes('turn on') &&
                             !lower.includes('turn off') &&
                             !lower.includes('settings') &&
                             !lower.includes('menu')
              
              if (isValid) {
                candidateNames.push({ name, selector })
              }
            }
          }
        }
        
        // Prioritize: Skip generic "Unknown Speaker" labels if we have other options
        let bestName: { name: string; selector: string } | null = null
        
        // First pass: Look for non-generic names
        for (const candidate of candidateNames) {
          if (!/^unknown\s+speaker\s*\d*/i.test(candidate.name)) {
            bestName = candidate
            break
          }
        }
        
        // Second pass: If only generic names found, use the first one (but it will be filtered later)
        if (!bestName && candidateNames.length > 0) {
          bestName = candidateNames[0]
          console.log(`[${BOT_ID}] ⚠️ Only found generic label in tile: ${bestName.name}`)
        }
        
        if (bestName && !found.some(p => p.name === bestName.name)) {
          found.push({ name: bestName.name, element: `tile-${bestName.selector}` })
          console.log(`[${BOT_ID}] 👤 Found participant: ${bestName.name} (via ${bestName.selector})`)
          foundName = true
        }
      }
      
      // Strategy 2: Check participant panel/people sidebar (if visible)
      const participantPanelSelectors = [
        '[aria-label*="participant" i]',
        '[aria-label*="people" i]',
        '[data-panel-id="people"]',
        '.participant-list',
        '.people-list'
      ]
      
      for (const panelSelector of participantPanelSelectors) {
        const participantPanel = document.querySelector(panelSelector)
        if (participantPanel) {
          console.log(`[${BOT_ID}] 📋 Found participant panel: ${panelSelector}`)
          const listItems = participantPanel.querySelectorAll('[role="listitem"], .participant-item, .attendee-item, li')
          console.log(`[${BOT_ID}] 📋 Found ${listItems.length} list items in panel`)
          
          listItems.forEach(item => {
            const nameSelectors = ['[data-participant-name]', '[data-name]', '.name', 'span', 'div']
            for (const nameSelector of nameSelectors) {
              const nameElem = item.querySelector(nameSelector)
              if (nameElem && nameElem.textContent) {
                const name = nameElem.textContent.trim().replace(/\s*\(You\)/i, '').trim()
                const lower = name.toLowerCase()
                if (name && name !== botName && name.length > 1 && name.length < 50 &&
                    !lower.includes('mute') && !lower.includes('unmute') &&
                    !found.some(p => p.name === name)) {
                  found.push({ name, element: 'participant-panel' })
                  console.log(`[${BOT_ID}] 👤 Found participant in panel: ${name}`)
                  break
                }
              }
            }
          })
          break // Found a panel, no need to check others
        }
      }
      
      console.log(`[${BOT_ID}] 📋 Total participants found: ${found.length}`)
      return found
    }, BOT_ID, state.botName)
    
    // Update roster with timestamp, filtering and cleaning names
    const now = Date.now()
    if (participants) {
      participants.forEach(p => {
        const cleanedName = cleanParticipantName(p.name, state.botName)
        if (cleanedName) {
          if (!roster.has(cleanedName)) {
            roster.set(cleanedName, {
              name: cleanedName,
              lastActive: now,
              activityCount: 0
            })
            if (cleanedName !== p.name) {
              console.log(`✅ [${BOT_ID}] Added participant: "${cleanedName}" (cleaned from "${p.name}")`)
            } else {
              console.log(`✅ [${BOT_ID}] Added participant: "${cleanedName}"`)
            }
          } else {
            // Duplicate detected after cleaning
            if (cleanedName !== p.name) {
              console.log(`🔄 [${BOT_ID}] Skipped duplicate: "${p.name}" → "${cleanedName}" (already in roster)`)
            }
          }
        } else {
          console.log(`🚫 [${BOT_ID}] Filtered out: "${p.name}" (bot or invalid name)`)
        }
      })
    }
    
    console.log(`🎭 [${BOT_ID}] Participant roster built: ${Array.from(roster.keys()).join(', ')} (${roster.size} total)`)
    console.log(`🎭 [${BOT_ID}] Filtered ${participants?.length || 0} raw detections → ${roster.size} valid participants`)
  } catch (error) {
    console.error(`❌ [${BOT_ID}] Error building participant roster:`, error)
  }
  
  return roster
}

// ✅ **Smart Speaker Selection with Confidence Scoring**
export function selectSpeakerIntelligently(): { speaker: string; confidence: number; method: string } {
  const now = Date.now()
  const timeSinceLastUpdate = now - state.lastSpeakerUpdate
  
  // Priority 1: Trust RECENT visual detection, but be skeptical if:
  // - We have multiple participants in the roster
  // - The same person has been detected continuously for > 45 seconds
  // This handles cases where visual detection gets stuck on one person
  if (state.currentSpeaker && 
      state.currentSpeaker !== 'Unknown' && 
      state.currentSpeaker !== 'User' &&
      state.currentSpeaker !== state.botName &&
      timeSinceLastUpdate < 3000) {
    
    const availableParticipants = Array.from(state.participantRoster.values())
      .filter(p => p.name !== state.botName)
    
    // If multiple participants exist, check how long current speaker has been active
    if (availableParticipants.length > 1 && state.currentSpeakerStartTime) {
      const continuousSpeakingDuration = now - state.currentSpeakerStartTime
      
      // If same person detected continuously for > 45 seconds with other participants present,
      // be skeptical - visual detection might be stuck
      if (continuousSpeakingDuration > 45000) {
        console.log(`⚠️ [${BOT_ID}] Visual detection stuck on ${state.currentSpeaker} for ${Math.round(continuousSpeakingDuration/1000)}s with ${availableParticipants.length} participants - using roster rotation`)
        // Don't use visual detection, fall through to roster-based selection
      } else {
        return {
          speaker: state.currentSpeaker,
          confidence: 0.9,
          method: 'visual-detection'
        }
      }
    } else {
      // Single or no participants - trust visual detection
      return {
        speaker: state.currentSpeaker,
        confidence: 0.9,
        method: 'visual-detection'
      }
    }
  }
  
  // Priority 2: Use participant roster with intelligent selection
  if (state.participantRoster.size > 0) {
    const availableParticipants = Array.from(state.participantRoster.values())
      .filter(p => p.name !== state.botName)
    
    if (availableParticipants.length === 1) {
      // Only one participant - they must be speaking
      return {
        speaker: availableParticipants[0].name,
        confidence: 0.85,
        method: 'single-participant'
      }
    } else if (availableParticipants.length > 1) {
      // Multiple participants - use roster with smart detection
      
      // Find participants who were RECENTLY visually detected as active (last 10 seconds)
      // but are not the current speaker
      const recentlyActiveOthers = availableParticipants.filter(p => 
        p.name !== state.currentSpeaker && 
        (now - p.lastActive) < 10000
      )
      
      // ✅ If we detected other active speakers recently, switch to them
      if (recentlyActiveOthers.length > 0) {
        // Sort by most recent activity
        const sorted = recentlyActiveOthers.sort((a, b) => b.lastActive - a.lastActive)
        console.log(`🎯 [${BOT_ID}] Switching to recently active speaker: ${sorted[0].name} (active ${Math.round((now - sorted[0].lastActive)/1000)}s ago)`)
        return {
          speaker: sorted[0].name,
          confidence: 0.75,
          method: 'recently-detected-active'
        }
      }
      
      // ✅ If current speaker has been active for > 45 seconds, check if ANYONE ELSE
      // has been detected as active recently (within last 30 seconds)
      if (state.currentSpeakerStartTime && (now - state.currentSpeakerStartTime) > 45000) {
        // Look for anyone else who was detected in last 30 seconds
        const anyOtherRecentActivity = availableParticipants.filter(p => 
          p.name !== state.currentSpeaker && 
          (now - p.lastActive) < 30000
        )
        
        if (anyOtherRecentActivity.length > 0) {
          // We detected other activity somewhat recently - rotate to most recent
          const sorted = anyOtherRecentActivity.sort((a, b) => b.lastActive - a.lastActive)
          console.log(`🔄 [${BOT_ID}] Current speaker ${state.currentSpeaker} active for ${Math.round((now - state.currentSpeakerStartTime)/1000)}s - rotating to other detected speaker: ${sorted[0].name} (last active ${Math.round((now - sorted[0].lastActive)/1000)}s ago)`)
          return {
            speaker: sorted[0].name,
            confidence: 0.65,
            method: 'rotation-to-recently-detected'
          }
        } else {
          // No other activity detected - keep current speaker (likely a monologue)
          console.log(`⚠️ [${BOT_ID}] Current speaker ${state.currentSpeaker} active for ${Math.round((now - state.currentSpeakerStartTime)/1000)}s but no other participants detected as active - keeping current`)
          return {
            speaker: state.currentSpeaker,
            confidence: 0.7,
            method: 'continuation-no-alternatives'
          }
        }
      }
      
      // Default: pick most recently active from roster
      const sortedByRecency = availableParticipants
        .sort((a, b) => b.lastActive - a.lastActive)
      
      return {
        speaker: sortedByRecency[0].name,
        confidence: 0.6,
        method: 'most-recently-active'
      }
    }
  }
  
  // Priority 3: Check speaker history for patterns
  if (state.speakerHistory.length > 0) {
    const recentSpeaker = state.speakerHistory[state.speakerHistory.length - 1].speaker
    if (recentSpeaker !== 'User' && recentSpeaker !== 'Unknown') {
      const timeSinceLastUpdate = Date.now() - state.lastSpeakerUpdate
      if (timeSinceLastUpdate < 15000) { // Within 15 seconds
        return {
          speaker: recentSpeaker,
          confidence: 0.5,
          method: 'recent-history'
        }
      }
    }
  }
  
  // Final fallback to "User"
  return {
    speaker: 'User',
    confidence: 0.1,
    method: 'fallback'
  }
}

export function isBufferSilent(buffer: Buffer, threshold = SILENCE_THRESHOLD) {
  if (buffer.length === 0) return true
  let total = 0
  const sampleCount = buffer.length / 2 // 16-bit samples
  for (let i = 0; i < buffer.length; i += 2) {
    const sample = buffer.readInt16LE(i)
    total += sample * sample
  }
  const rms = Math.sqrt(total / sampleCount)
  //console.log('Current RMS:', rms)
  return rms < threshold
}

// ✅ **Helper function to safely execute page.evaluate operations with CDP error handling**
async function safePageEvaluate<T>(page: Page, func: any, ...args: any[]): Promise<T | null> {
  try {
    // **CRITICAL**: Check emergency shutdown flag first
    if (isEmergencyShutdown) {
      console.log('🚫 [EMERGENCY] Skipping page evaluation - emergency shutdown active')
      return null
    }
    
    // Enhanced safety checks before evaluation
    if (page.isClosed() || !state.activeBrowser || !state.activeBrowser.isConnected()) {
      console.log('⚠️ Skipping page evaluation - browser/page unavailable')
      return null
    }
    
    // **CRITICAL**: All platforms now use conservative CDP handling to preserve audio
    const currentUrl = page.url()
    const platform = detectMeetingPlatform(currentUrl)
    
    // ✅ **ZOOM FIX**: Removed aggressive pendingProtocolErrors check
    // Pending errors during UI interactions (like opening participants panel) are normal
    // and don't indicate actual failure. Audio capture continues to work fine.
    // Only actual thrown CDP errors (in catch block) should trigger shutdown considerations.
    
    return await page.evaluate(func, ...args)
  } catch (error) {
    // Handle CDP Protocol errors gracefully
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (
      errorMessage.includes('Protocol error') || 
      errorMessage.includes('Session closed') || 
      errorMessage.includes('Target closed') ||
      errorMessage.includes('Execution context was destroyed') ||
      errorMessage.includes('Cannot find context with specified id') ||
      errorMessage.includes('TargetCloseError')
    ) {
      console.log(`⚠️ [${BOT_ID}] Browser context destroyed or CDP connection lost during evaluation - cleanup in progress`)
      console.log(`📍 [${BOT_ID}] Error details: ${errorMessage}`)
      
      // ✅ **ZOOM FIX**: All platforms now use conservative CDP handling
      // Most CDP errors during normal operations (like UI interactions) are recoverable
      // Audio capture continues to work. Only trigger shutdown if browser truly dead.
      const currentUrl = page.url()
      const platform = detectMeetingPlatform(currentUrl)
      
      console.log(`🎯 [${BOT_ID}] ${platform} CDP error detected - conservative handling to preserve audio capture`)
      
      // Check if browser is truly dead before triggering shutdown
      if (page.isClosed() || !state.activeBrowser || !state.activeBrowser.isConnected()) {
        console.log(`🛑 [${BOT_ID}] Browser truly disconnected - triggering shutdown`)
        triggerEmergencyShutdown(`CDP error in ${platform}: ${errorMessage}`)
        stopMeetBot().catch(err => console.error('Error stopping bot:', err))
      } else {
        console.log(`✅ [${BOT_ID}] Browser still connected - ignoring transient CDP error, audio capture continues`)
      }
      
      return null
    } else {
      console.warn(`⚠️ [${BOT_ID}] Page evaluation failed:`, errorMessage)
    }
    return null
  }
}

// ✅ **Enhanced error detection and protection system**
function setupComprehensiveProtection(page: Page, browser: any) {
  try {
    // ✅ **CRITICAL**: Store page reference for emergency shutdown
    emergencyPageRef = page
    
    // **CRITICAL**: Detect platform first to avoid interfering with Google Meet audio
    const currentUrl = page.url()
    const platform = detectMeetingPlatform(currentUrl)
    
    if (platform === 'google-meet') {
      console.log('✅ [PROTECTION] Google Meet detected - using minimal protection to preserve audio quality')
      setupMinimalGoogleMeetProtection(page, browser)
      return
    }
    
    console.log(`✅ [PROTECTION] ${platform} detected - applying conservative CDP protection (audio-preserving)`)
    
    // ✅ **ULTRA-AGGRESSIVE**: Store original functions and IMMEDIATELY override with protection
    const originalEvaluate = page.evaluate.bind(page)
    const originalClick = page.click ? page.click.bind(page) : null
    const originalType = page.type ? page.type.bind(page) : null
    
    // **IMMEDIATE OVERRIDE** - Replace page.evaluate immediately with protective wrapper
    console.log('🛡️ [ULTRA-PROTECTION] Installing immediate page.evaluate protection')
    page.evaluate = async function(pageFunction: any, ...args: any[]) {
      try {
        // **CRITICAL**: Check emergency shutdown flag first
        if (isEmergencyShutdown) {
          console.log('🚫 [GLOBAL EMERGENCY] Skipping page evaluation - emergency shutdown active')
          return null
        }
        
        // Enhanced safety checks
        if (page.isClosed() || !state.activeBrowser || !state.activeBrowser.isConnected()) {
          console.log('⚠️ [GLOBAL PROTECTION] Skipping page evaluation - browser/page unavailable')
          return null
        }
        
        // ✅ **ZOOM FIX**: Removed pendingProtocolErrors check
        // This was causing premature shutdown during normal UI interactions
        // Audio capture was working fine, but bot was stopping due to transient CDP warnings
        
        return await originalEvaluate(pageFunction, ...args)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (
          errorMessage.includes('Protocol error') || 
          errorMessage.includes('Session closed') || 
          errorMessage.includes('Target closed') ||
          errorMessage.includes('Execution context was destroyed') ||
          errorMessage.includes('Cannot find context with specified id') ||
          errorMessage.includes('TargetCloseError')
        ) {
          console.log(`⚠️ [GLOBAL PROTECTION] Caught page.evaluate CDP error: ${errorMessage}`)
          
          // ✅ **ZOOM FIX**: Check if browser is truly dead before shutdown
          if (page.isClosed() || !state.activeBrowser || !state.activeBrowser.isConnected()) {
            console.log(`🛑 [GLOBAL PROTECTION] Browser truly disconnected - triggering emergency shutdown`)
            triggerEmergencyShutdown(`Global CDP error: ${errorMessage}`)
            stopMeetBot().catch(err => console.error('Error stopping bot:', err))
          } else {
            console.log(`✅ [GLOBAL PROTECTION] Browser still connected - ignoring transient CDP error`)
          }
          
          return null
        } else {
          // Re-throw non-CDP errors
          throw error
        }
      }
    }

    // 2. Monitor browser disconnect events
    browser.on('disconnected', () => {
      console.log('🔌 [PROTECTION] Browser disconnected - stopping all operations')
      
      // ✅ **CRITICAL**: Only trigger shutdown if not already closing to prevent race conditions
      if (!state.isClosing) {
        triggerEmergencyShutdown('Browser disconnected')
        stopMeetBot().catch(err => console.error('Error stopping bot after disconnect:', err))
      } else {
        console.log('⚠️ [PROTECTION] Bot already stopping - ignoring browser disconnect to prevent race condition')
      }
    })

    // 3. Monitor target events for early warning
    browser.on('targetdestroyed', (target: any) => {
      if (target && target.url && target.url() === page.url()) {
        console.log('🎯 [PROTECTION] Current page target being destroyed - stopping operations')
        
        // ✅ **CRITICAL**: Only trigger shutdown if not already closing to prevent race conditions
        if (!state.isClosing) {
          triggerEmergencyShutdown('Target being destroyed')
          stopMeetBot().catch(err => console.error('Error stopping bot after target destruction:', err))
        } else {
          console.log('⚠️ [PROTECTION] Bot already stopping - ignoring target destruction to prevent race condition')
        }
      }
    })

    console.log('✅ [PROTECTION] Comprehensive CDP protection system activated')
  } catch (error) {
    console.warn('⚠️ [PROTECTION] Failed to setup comprehensive protection:', error)
    // Fallback to basic protection
    setupBasicPageProtection(page)
  }
}

// ✅ **Minimal protection for Google Meet to preserve audio quality**
function setupMinimalGoogleMeetProtection(page: Page, browser: any) {
  try {
    // ✅ **CRITICAL**: Store page reference for emergency shutdown even for Google Meet
    emergencyPageRef = page
    
    // ✅ **GOOGLE MEET AUDIO PRESERVATION**: NO page.evaluate override to preserve audio quality
    console.log('🎵 [GOOGLE MEET] Preserving audio quality - no page.evaluate override')
    
    // Only browser-level protection for Google Meet to preserve sensitive audio capture
    
    // 1. Monitor browser disconnect events
    browser.on('disconnected', () => {
      console.log('🔌 [GOOGLE MEET PROTECTION] Browser disconnected - stopping all operations')
      
      // ✅ **CRITICAL**: Only trigger shutdown if not already closing to prevent race conditions
      if (!state.isClosing) {
        triggerEmergencyShutdown('Google Meet browser disconnected')
        stopMeetBot().catch(err => console.error('Error stopping bot after disconnect:', err))
      } else {
        console.log('⚠️ [GOOGLE MEET PROTECTION] Bot already stopping - ignoring browser disconnect to prevent race condition')
      }
    })

    // 2. Monitor target events for early warning
    browser.on('targetdestroyed', (target: any) => {
      if (target && target.url && target.url() === page.url()) {
        console.log('🎯 [GOOGLE MEET PROTECTION] Current page target being destroyed - stopping operations')
        
        // ✅ **CRITICAL**: Only trigger shutdown if not already closing to prevent race conditions
        if (!state.isClosing) {
          triggerEmergencyShutdown('Google Meet target being destroyed')
          stopMeetBot().catch(err => console.error('Error stopping bot after target destruction:', err))
        } else {
          console.log('⚠️ [GOOGLE MEET PROTECTION] Bot already stopping - ignoring target destruction to prevent race condition')
        }
      }
    })

    console.log('✅ [GOOGLE MEET PROTECTION] Minimal protection active - preserving audio quality')
  } catch (error) {
    console.warn('⚠️ [GOOGLE MEET PROTECTION] Failed to setup minimal protection:', error)
  }
}

// ✅ **Fallback basic protection**
function setupBasicPageProtection(page: Page) {
  const originalEvaluate = page.evaluate.bind(page)
  page.evaluate = async function(pageFunction: any, ...args: any[]) {
    try {
      if (page.isClosed() || !state.activeBrowser || !state.activeBrowser.isConnected()) {
        console.log('⚠️ [BASIC PROTECTION] Skipping page evaluation - browser/page unavailable')
        return null
      }
      return await originalEvaluate(pageFunction, ...args)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (
        errorMessage.includes('Protocol error') || 
        errorMessage.includes('Target closed') ||
        errorMessage.includes('TargetCloseError')
      ) {
        console.log(`⚠️ [BASIC PROTECTION] Caught CDP error: ${errorMessage}`)
        if (state.isBotRunning) {
          stopMeetBot().catch(err => console.error('Error stopping bot:', err))
        }
        return null
      } else {
        throw error
      }
    }
  }
}

export async function monitorKickout(page: Page) {
  console.log(`⏳ [${BOT_ID}] Waiting for bot to be let into the meeting...`)
  
  // Set up comprehensive protection for any remaining unprotected page.evaluate calls
  setupComprehensiveProtection(page, state.activeBrowser)

  const startTime = Date.now()
  const maxWaitTime = 15 * 60 * 1000 // 15 minutes in milliseconds
  
  // Detect platform
  const currentUrl = page.url()
  const platform = detectMeetingPlatform(currentUrl)

  while (
    Date.now() - startTime < maxWaitTime &&
    state.isBotRunning &&
    !state.hasJoined &&
    !page.isClosed()
  ) {
    try {
      let isWaiting = false
      
      // Check for real audio from participants
      const receivingAudioBackend = state.currentSpeaker !== 'Unknown' && state.currentSpeaker !== 'User'
      
      const hasRealSpeaker = state.currentSpeaker && 
        state.currentSpeaker !== 'Unknown' && 
        state.currentSpeaker !== 'User' &&
        state.currentSpeaker.trim().length > 0
      
      // If receiving audio from a real speaker, we've successfully joined
      if (receivingAudioBackend && hasRealSpeaker) {
        console.log(`[${BOT_ID}] Speaker detected: '${state.currentSpeaker}' - bot joined meeting`)
        
        state.hasJoined = true
        state.joinedAt = Date.now()
        
        if (state.meetingId) {
          const { markMeetingAsRecording } = await import('./dynamo.ts')
          await markMeetingAsRecording(state.meetingId)
        }
        
        const { audioProcessor } = await import('./audio-processor.ts')
        audioProcessor.markMeetingJoined()
        
        console.log('Bot has joined meeting - audio processing running')
        
        monitorParticipants(page)
        break
      }
      
      if (platform === 'google-meet') {
        // Clean, focused waiting room detection
        isWaiting = await page.evaluate(() => {
          // Simple helper functions
          const checkWaitingIndicators = () => {
            const bodyText = document.body.innerText.toLowerCase()
            const commonWaitingPhrases = ['asking to join', 'waiting for the host', 'waiting to join', 'waiting for someone to let you in']
            const hasWaitingText = commonWaitingPhrases.some(phrase => bodyText.includes(phrase))
            
            const askButton = document.querySelector('span[jsname="V67aGc"].UywwFc-vQzf8d') as HTMLElement
            const hasVisibleButton = askButton && askButton.offsetWidth > 0 && 
              window.getComputedStyle(askButton).display !== 'none'
            
            return hasWaitingText || hasVisibleButton
          }
          
          const checkMeetingParticipants = () => {
            return document.querySelectorAll('[data-participant-id]:not([data-self])').length > 0
          }
          
          const checkActiveMeetingUI = () => {
            // ✅ STRICTER: Check for meeting control buttons that only appear when actually in meeting
            const leaveButton = document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
            const muteButton = document.querySelector('[aria-label*="Mute"], [aria-label*="microphone"]')
            const moreOptionsButton = document.querySelector('[aria-label*="More options"], [aria-label*="More actions"]')
            
            // Check for participant grid or video tiles (more reliable indicator)
            const participantGrid = document.querySelector('[data-allocation-index]')
            const videoTiles = document.querySelectorAll('div[jsname="E2KThb"]')
            
            // Check for meeting info button (only visible when in actual meeting)
            const meetingInfo = document.querySelector('[data-tooltip*="meeting details"], [aria-label*="meeting details"]')
            
            // Check for chat/activities panel (strong indicator)
            const chatPanel = document.querySelector('[data-panel-id], [jsname="DRhqHd"]')
            
            // Must have ALL controls AND meeting features to be confident
            const hasBasicControls = !!(leaveButton && muteButton && moreOptionsButton)
            const hasParticipantArea = !!(participantGrid || videoTiles.length > 0)
            const hasMeetingFeatures = !!(meetingInfo || chatPanel)
            
            return hasBasicControls && (hasParticipantArea || hasMeetingFeatures)
          }
          
          // ✅ STRICTER: Require BOTH participants AND meeting UI to trigger double-check
          const waitingIndicators = checkWaitingIndicators()
          const hasParticipants = checkMeetingParticipants()
          const hasActiveMeetingUI = checkActiveMeetingUI()
          
          // If we see any waiting indicators, definitely still waiting
          if (waitingIndicators) {
            console.log('🚪 Bot is still waiting at the door...')
            return true
          }
          
          // If meeting UI is present and no waiting indicators, trigger join check
          if (hasActiveMeetingUI) {
            console.log('✅ Potential meeting entry - meeting UI detected')
            return false
          }
          
          // If we have participants but no meeting UI, might still be in preview
          if (hasParticipants && !hasActiveMeetingUI) {
            console.log('🚪 Bot is still waiting at the door... (participants visible but no meeting UI)')
            return true
          }
          
          // No clear indicators - assume still waiting
          console.log('🚪 Bot is still waiting at the door... (no meeting indicators)')
          return true
        })
        
        // ✅ **OVERRIDE**: If we're receiving audio with detected speakers, we're definitely in
        if (receivingAudioBackend) {
          console.log(`✅ [${BOT_ID}] AUDIO OVERRIDE: Speaker '${state.currentSpeaker}' detected - bot IS in meeting (was waiting: ${isWaiting})`)
          isWaiting = false
        }
      } else if (platform === 'teams') {
        // ✅ **ENHANCED**: More comprehensive Teams lobby detection
        const teamsWaitingIndicators = await safePageEvaluate<boolean>(page, () => {
          const bodyText = document.body.innerText.toLowerCase()
          const hasWaitingText = 
            bodyText.includes('waiting in the lobby') ||
            bodyText.includes('waiting for approval') ||
            bodyText.includes('waiting to be admitted') ||
            bodyText.includes('waiting for the host') ||
            bodyText.includes('waiting to join')
          
          const hasLobbyElements = !!(
            document.querySelector('[data-tid="lobby-screen"]') ||
            document.querySelector('[class*="lobby"]') ||
            document.querySelector('[aria-label*="lobby"]') ||
            document.querySelector('[aria-label*="waiting"]') ||
            document.querySelector('[class*="waiting"]')
          )
          
          const hasActiveMeetingUI = !!(
            document.querySelector('[data-tid="calling-screen"]') ||
            document.querySelector('[data-tid="roster-button"]') ||
            document.querySelector('[aria-label*="microphone"]') ||
            document.querySelector('[aria-label*="camera"]') ||
            document.querySelector('[data-tid="toggle-mute"]') ||
            document.querySelector('[data-tid="toggle-video"]')
          )
          
          // If we have clear meeting UI, we're definitely not waiting
          if (hasActiveMeetingUI) {
            return false
          }
          
          // If we have explicit waiting/lobby indicators, we're definitely waiting
          if (hasWaitingText || hasLobbyElements) {
            return true
          }
          
          // Default to not waiting if we can't determine clearly
          return false
        })
        
        // Handle null result from CDP errors  
        if (teamsWaitingIndicators === null) {
          console.log(`⚠️ [${BOT_ID}] Failed to check Teams waiting status due to CDP error - assuming not waiting`)
          isWaiting = false
        } else {
          isWaiting = teamsWaitingIndicators
        }
      } else if (platform === 'zoom') {
        // ✅ **ENHANCED**: More comprehensive Zoom waiting room detection
        const zoomWaitingIndicators = await safePageEvaluate<boolean>(page, () => {
          const bodyText = document.body.innerText.toLowerCase()
          const hasWaitingText = 
            bodyText.includes('waiting for the host') ||
            bodyText.includes('waiting room') ||
            bodyText.includes('please wait') ||
            bodyText.includes('waiting to be admitted') ||
            bodyText.includes('you are in a waiting room')
          
          const hasWaitingElements = !!(
            document.querySelector('[class*="waiting-room"]') ||
            document.querySelector('[class*="waitingroom"]') ||
            document.querySelector('[aria-label*="waiting"]') ||
            document.querySelector('[class*="lobby"]') ||
            document.querySelector('[data-testid*="waiting"]')
          )
          
          const hasActiveMeetingUI = !!(
            document.querySelector('[aria-label*="mute"]') ||
            document.querySelector('[aria-label*="video"]') ||
            document.querySelector('[class*="video-container"]') ||
            document.querySelector('[class*="participants"]') ||
            document.querySelector('[aria-label*="microphone"]') ||
            document.querySelector('[class*="meeting-client"]')
          )
          
          // If we have clear meeting UI, we're definitely not waiting
          if (hasActiveMeetingUI) {
            return false
          }
          
          // If we have explicit waiting indicators, we're definitely waiting
          if (hasWaitingText || hasWaitingElements) {
            return true
          }
          
          // Default to not waiting if we can't determine clearly
          return false
        })
        
        // Handle null result from CDP errors
        if (zoomWaitingIndicators === null) {
          console.log(`⚠️ [${BOT_ID}] Failed to check Zoom waiting status due to CDP error - assuming not waiting`)
          isWaiting = false
        } else {
          isWaiting = zoomWaitingIndicators
        }
      }
      
      if (isWaiting) {
        console.log(`🚪 [${BOT_ID}] Bot is still waiting at the door...`)
        
        // ✅ **SKIP WAITING if we have real speakers** - don't even delay
        if (receivingAudioBackend) {
          console.log(`⚡ [${BOT_ID}] BYPASS WAIT: Real speaker detected, treating as joined immediately`)
          isWaiting = false
          // Fall through to join confirmation below
        } else {
          await delay(5000) // Check every 5 seconds
          continue // Continue waiting loop
        }
      }
      
      if (!isWaiting) {
        console.log(`🔍 [${BOT_ID}] Possible meeting entry detected - running thorough double-check...`)
        
        // ✅ **CRITICAL FIX**: Double-check after a delay to avoid false positives
        await delay(3000)
        
        // ✅ Re-check backend audio state (might have changed)
        const receivingAudioBackendRecheck = state.currentSpeaker !== 'Unknown' && state.currentSpeaker !== 'User'
        console.log(`🔍 [${BOT_ID}] Double-check audio state: '${state.currentSpeaker}', receivingAudio: ${receivingAudioBackendRecheck}`)
        
        // Re-run same simplified detection logic for consistency
        const joinCheckResult = await page.evaluate(() => {
          const checkWaitingIndicators = () => {
            const bodyText = document.body.innerText.toLowerCase()
            const commonWaitingPhrases = ['asking to join', 'waiting for the host', 'waiting to join', 'waiting for someone to let you in']
            const hasWaitingText = commonWaitingPhrases.some(phrase => bodyText.includes(phrase))
            
            const askButton = document.querySelector('span[jsname="V67aGc"].UywwFc-vQzf8d') as HTMLElement
            const hasVisibleButton = askButton && askButton.offsetWidth > 0 && 
              window.getComputedStyle(askButton).display !== 'none'
            
            return hasWaitingText || hasVisibleButton
          }
          
          const checkMeetingParticipants = () => {
            // ✅ More strict: count participants excluding self
            const participants = document.querySelectorAll('[data-participant-id]:not([data-self])')
            return participants.length > 0
          }
          
          const checkActiveMeetingUI = () => {
            // ✅ STRICTER: Check for meeting control buttons that only appear when actually in meeting
            const leaveButton = document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
            const muteButton = document.querySelector('[aria-label*="Mute"], [aria-label*="microphone"]')
            const moreOptionsButton = document.querySelector('[aria-label*="More options"], [aria-label*="More actions"]')
            
            // Check for participant grid or video tiles (more reliable indicator)
            const participantGrid = document.querySelector('[data-allocation-index]')
            const videoTiles = document.querySelectorAll('div[jsname="E2KThb"]')
            
            // ✅ Check for meeting info button (only visible when in actual meeting)
            const meetingInfo = document.querySelector('[data-tooltip*="meeting details"], [aria-label*="meeting details"]')
            
            // ✅ Check for chat/activities panel (strong indicator)
            const chatPanel = document.querySelector('[data-panel-id], [jsname="DRhqHd"]')
            
            // Must have ALL of these to confirm we're in a meeting:
            // 1. Leave button (essential)
            // 2. At least 2 other controls (mute/more options)
            // 3. Either participant area OR chat panel OR meeting info
            const hasBasicControls = !!(leaveButton && muteButton && moreOptionsButton)
            const hasParticipantArea = !!(participantGrid || videoTiles.length > 0)
            const hasMeetingFeatures = !!(meetingInfo || chatPanel)
            
            return hasBasicControls && (hasParticipantArea || hasMeetingFeatures)
          }
          
          const waitingIndicators = checkWaitingIndicators()
          const hasParticipants = checkMeetingParticipants()
          const hasActiveMeetingUI = checkActiveMeetingUI()
          
          console.log(`🔍 Double-check: waiting=${waitingIndicators}, participants=${hasParticipants}, meetingUI=${hasActiveMeetingUI}`)
          
          // ✅ ROBUST LOGIC: Prioritize UI indicators
          // 1. No waiting indicators present
          if (waitingIndicators) {
            return { hasJoined: false, reason: 'waiting_indicators_present' }
          }
          
          // 2. If meeting UI is present, bot has joined (even if alone in meeting)
          // The presence of meeting controls (leave, mute, etc.) is sufficient proof
          if (hasActiveMeetingUI) {
            if (hasParticipants) {
              return { hasJoined: true, reason: 'participants_and_meeting_ui_confirmed' }
            } else {
              return { hasJoined: true, reason: 'meeting_ui_confirmed_bot_alone' }
            }
          }
          
          // 3. If participants visible but no meeting UI, might be in preview/waiting
          if (hasParticipants && !hasActiveMeetingUI) {
            return { hasJoined: false, reason: 'participants_visible_but_no_meeting_ui' }
          }
          
          return { hasJoined: false, reason: 'no_meeting_indicators' }
        })
        
        // ✅ **BACKEND AUDIO OVERRIDE**: If we're receiving audio with real speakers, we're definitely in
        if (receivingAudioBackendRecheck && !joinCheckResult.hasJoined) {
          console.log(`✅ [${BOT_ID}] AUDIO OVERRIDE IN DOUBLE-CHECK: Speaker '${state.currentSpeaker}' detected - forcing join confirmation`)
          joinCheckResult.hasJoined = true
          joinCheckResult.reason = 'backend_audio_detected'
        }
        
        if (!joinCheckResult.hasJoined) {
          console.log(`🚪 [${BOT_ID}] Double-check confirmed: still waiting in lobby (${joinCheckResult.reason})`)
          // Continue waiting loop - no delay here since we already delayed
        } else {
          console.log(`✅ [${BOT_ID}] Double-check confirmed: Bot has entered the meeting! (${joinCheckResult.reason})`)
          
          // ✅ Grace period to allow UI to fully load
          console.log(`⏳ [${BOT_ID}] Waiting 5 seconds for meeting UI to stabilize...`)
          await delay(5000)

          state.hasJoined = true
          state.joinedAt = Date.now() // Record when bot joined for grace period calculations
          
          // ✅ **IMMEDIATE SPEAKER CHECK** - Get a speaker right away instead of waiting
          try {
            const immediateSpeakers = await getActiveSpeakers(page)
            if (immediateSpeakers.length > 0) {
              const firstSpeaker = immediateSpeakers.find(name => name !== state.botName)
              if (firstSpeaker && firstSpeaker !== 'User' && firstSpeaker !== 'Unknown') {
                state.currentSpeaker = firstSpeaker
                console.log(`🎤 [${BOT_ID}] Immediate speaker detected on join: ${firstSpeaker}`)
                
                // ✅ RE-ENABLED: Log speaker change for hybrid audio-visual approach
                const changeTimestamp = Date.now()
                state.speakerChangeLog.push({
                  timestamp: changeTimestamp,
                  speaker: firstSpeaker,
                  isoTimestamp: new Date(changeTimestamp).toISOString()
                })
                console.log(`📝 [${BOT_ID}] Logged initial speaker: ${firstSpeaker}`)
              }
            }
          } catch (err) {
            console.log(`⚠️ [${BOT_ID}] Could not get immediate speaker on join:`, err)
          }
          
          // Update DynamoDB status to 'recording' when successfully joined
          if (state.meetingId) {
            const { markMeetingAsRecording } = await import('./dynamo.ts')
            await markMeetingAsRecording(state.meetingId)
          }
          
          // 🛡️ Mark audio processor that we've joined the meeting (reduce false positives)
          const { audioProcessor } = await import('./audio-processor.ts')
          audioProcessor.markMeetingJoined()
          
          // ✅ Audio processing already started earlier - just log confirmation
          console.log('✅ Bot has joined meeting - audio processing already running for transcription')
          
          // ❌ DISABLED: Speaker timeline logger (visual detection unreliable)
          // Visual detection often misses speaker changes or gets stuck on one speaker
          // Assembly.ai's audio-based diarization is more accurate and reliable
          // if (state.speakerTimelineLogPath) {
          //   speakerTimelineLogger.start(state.speakerTimelineLogPath, 1000)
          // }
          
          // 👉 START monitorParticipants
          monitorParticipants(page)
          break // Exit waiting loop and start monitoring
        }
      }
    } catch (err) {
      console.error(`[${BOT_ID}] Error while waiting for entry:`, err)
    }

    // ✅ CRITICAL FIX: Check if bot joined during error/async operations
    if (state.hasJoined) {
      console.log(`✅ [${BOT_ID}] Bot has joined (detected after check) - exiting monitorKickout`)
      break
    }

    await delay(5000) // Check every 5 seconds
  }

  // If bot is already stopping or page closed, bail out.
  if (!state.isBotRunning || page.isClosed()) {
    console.log('Bot was stopped or page closed, exiting monitorKickout...')
    return
  }
  
  // ✅ CRITICAL FIX: If bot already joined, skip the final timeout check
  // This prevents false "waiting room" detection after bot has joined
  if (state.hasJoined) {
    console.log(`✅ [${BOT_ID}] Bot already joined - skipping final timeout check and proceeding to kickout monitoring`)
  } else {
    // Final check if still waiting after timeout (ONLY if bot hasn't joined)
    let stillWaiting = false
  
  // ✅ Check backend audio state first (most reliable)
  const receivingAudioBackend = state.currentSpeaker !== 'Unknown' && state.currentSpeaker !== 'User'
  
  if (platform === 'google-meet') {
    // ✅ **FIXED**: Use same improved waiting room detection logic
    stillWaiting = await page.evaluate(() => {
      const checkWaitingIndicators = () => {
        const bodyText = document.body.innerText.toLowerCase()
        const commonWaitingPhrases = ['asking to join', 'waiting for the host', 'waiting to join']
        const hasWaitingText = commonWaitingPhrases.some(phrase => bodyText.includes(phrase))
        
        const askButton = document.querySelector('span[jsname="V67aGc"].UywwFc-vQzf8d') as HTMLElement
        const hasVisibleButton = askButton && askButton.offsetWidth > 0 && 
          window.getComputedStyle(askButton).display !== 'none'
        
        return hasWaitingText || hasVisibleButton
      }
      
      const checkMeetingParticipants = () => {
        return document.querySelectorAll('[data-participant-id]:not([data-self])').length > 0
      }
      
      const checkActiveMeetingUI = () => {
        // Check for meeting control buttons that only appear when actually in meeting
        const leaveButton = document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
        const muteButton = document.querySelector('[aria-label*="Mute"], [aria-label*="microphone"]')
        const moreOptionsButton = document.querySelector('[aria-label*="More options"], [aria-label*="More actions"]')
        
        // Check for participant grid or video tiles
        const participantGrid = document.querySelector('[data-allocation-index]')
        const videoTiles = document.querySelectorAll('div[jsname="E2KThb"]')
        
        // Check for meeting info button (only visible when in actual meeting)
        const meetingInfo = document.querySelector('[data-tooltip*="meeting details"], [aria-label*="meeting details"]')
        
        // Check for chat/activities panel (strong indicator)
        const chatPanel = document.querySelector('[data-panel-id], [jsname="DRhqHd"]')
        
        const hasBasicControls = !!(leaveButton && muteButton && moreOptionsButton)
        const hasParticipantArea = !!(participantGrid || videoTiles.length > 0)
        const hasMeetingFeatures = !!(meetingInfo || chatPanel)
        
        return hasBasicControls && (hasParticipantArea || hasMeetingFeatures)
      }
      
      const waitingIndicators = checkWaitingIndicators()
      const hasParticipants = checkMeetingParticipants()
      const hasActiveMeetingUI = checkActiveMeetingUI()
      
      console.log(`🔍 Final check: waiting=${waitingIndicators}, participants=${hasParticipants}, meetingUI=${hasActiveMeetingUI}`)
      
      // If waiting indicators present, definitely still waiting
      if (waitingIndicators) return true
      
      // If meeting UI is present, bot has joined (even if alone)
      if (hasActiveMeetingUI) return false
      
      // If participants present (but no meeting UI), might be edge case - not waiting
      if (hasParticipants) return false
      
      // No clear indicators - assume still waiting
      return true
    })
    
    // ✅ **BACKEND AUDIO OVERRIDE**: If we're receiving audio with real speakers, we're NOT waiting
    if (receivingAudioBackend) {
      console.log(`✅ [${BOT_ID}] Final check AUDIO OVERRIDE: Speaker '${state.currentSpeaker}' detected - bot successfully joined`)
      stillWaiting = false
    }
  } else if (platform === 'teams') {
    const lobbyIndicators = await page.$$('[data-tid="lobby-screen"], [class*="lobby"]')
    stillWaiting = lobbyIndicators.length > 0
  }

  if (stillWaiting) {
    console.log(
      `❌ [${BOT_ID}] Bot was not let into the meeting after 15 minutes. Marking as not admitted...`,
    )
    
    // Mark meeting as not admitted instead of completed
    if (state.meetingId) {
      const { markMeetingAsNotAdmitted } = await import('./dynamo.ts')
      await markMeetingAsNotAdmitted(state.meetingId)
    }
    
    await stopMeetBot()
    return
  }
  } // End of else block - final check only if bot hasn't joined

  console.log(`🎥 [${BOT_ID}] Monitoring for bot kickout...`)

  // Now that the bot is in, start monitoring for kickout
  while (state.isBotRunning) {
    try {
      // ✅ **CRITICAL**: Immediate exit if bot flagged as not running (race condition protection)
      if (!state.isBotRunning || isEmergencyShutdown) {
        console.log(`🚪 [${BOT_ID}] Bot flagged as not running or emergency shutdown - exiting kickout monitoring`)
        return
      }
      
      // ✅ **ENHANCED**: Additional check for browser/page health
      if (page.isClosed() || !state.activeBrowser || state.activeBrowser.isConnected() === false) {
        console.log(`🛑 [${BOT_ID}] Browser disconnected during kickout monitoring. Stopping bot...`)
        await stopMeetBot()
        break
      }
      
      if (platform === 'google-meet') {
        // Google Meet specific checks
        
        // Check for "You've been removed from the meeting" message
        const removedElem = await page.$('div.Fi0Gqc')
        if (removedElem) {
          const text = await page.evaluate((el) => el.innerText, removedElem)
          if (text.includes("You've been removed from the meeting")) {
            console.log(
              `🚨 [${BOT_ID}] Bot has been removed from the meeting. Stopping recording...`,
            )
            await stopMeetBot()
            break
          }
        }

        // ✅ **Enhanced Leave Button Detection - Multiple Selectors**
        const leaveButtonSelectors = [
          'button[aria-label="Leave call"]',
          'button[aria-label="End call"]', 
          'button[aria-label="Hang up"]',
          'button[aria-label="Exit meeting"]',
          'button[aria-label*="leave"]',
          'button[aria-label*="end"]',
          'button[aria-label*="exit"]',
          'button[aria-label*="hang"]',
          '[data-tooltip*="Leave"]',
          '[data-tooltip*="End"]',
          'button[jsname="CQylAd"]', // Google Meet specific leave button
          'button[jsname="Qx7uuf"]'  // Google Meet generic button
        ]
        
        let leaveCallButton = null
        let foundSelector = ''
        
        for (const selector of leaveButtonSelectors) {
          leaveCallButton = await page.$(selector)
          if (leaveCallButton) {
            foundSelector = selector
            break
          }
        }
        
        if (!leaveCallButton) {
          // ✅ **Additional Check: Look for meeting controls to confirm we're still in meeting**
          const meetingControlsExist = await page.evaluate(() => {
            // Check for any meeting control indicators
            const controlSelectors = [
              '[aria-label*="microphone"]',
              '[aria-label*="camera"]', 
              '[aria-label*="mic"]',
              '[aria-label*="video"]',
              '[jsname="BOHaEe"]', // Google Meet controls container
              '[data-participant-id]', // Participant elements
              '[class*="participant"]',
              'button[aria-label*="mute"]',
              'button[aria-label*="unmute"]'
            ]
            
            return controlSelectors.some(selector => !!document.querySelector(selector))
          })
          
          if (meetingControlsExist) {
            console.log(`⚠️ [${BOT_ID}] Leave button not found, but meeting controls detected - continuing...`)
          } else {
            console.log(`🚨 [${BOT_ID}] No leave button or meeting controls found. Bot may have been removed. Stopping recording...`)
            await stopMeetBot()
            break
          }
        } else {
          console.log(`✅ [${BOT_ID}] Leave button found using selector: ${foundSelector}`)
        }
      } else if (platform === 'teams') {
        // Microsoft Teams specific checks - MADE MORE CONSERVATIVE
        
        // Check for Teams removal messages
        const removalMessages = [
          'You have been removed from the meeting',
          'removed from the meeting',
          'Meeting has ended',
          'meeting has ended',
          'The meeting has been ended'
        ]
        
        const pageText = await safePageEvaluate<string>(page, () => document.body.innerText)
        
        // ✅ **ZOOM FIX**: Handle null result from transient CDP errors gracefully
        // Don't immediately stop - just skip this check and try again next iteration
        if (pageText === null) {
          console.log(`⚠️ [${BOT_ID}] Failed to check page text due to transient CDP error - skipping check, will retry`)
          await delay(5000)
          continue
        }
        
        const isRemoved = removalMessages.some(msg => pageText.toLowerCase().includes(msg.toLowerCase()))
        
        if (isRemoved) {
          console.log(
            `🚨 [${BOT_ID}] Bot has been removed from Teams meeting. Stopping recording...`,
          )
          await stopMeetBot()
          break
        }

        // MORE CONSERVATIVE: Only stop if we're clearly disconnected
        // Check if we're back at lobby/join screen or connection is lost
        const lobbySelectors = [
          '[data-tid="lobby-screen"]',
          '[class*="lobby"]',
          '[aria-label*="lobby"]',
          '[aria-label*="waiting room"]',
          'button[aria-label*="Join now"]',
          'button[aria-label*="join meeting"]'
        ]
        
        let isBackInLobby = false
        for (const selector of lobbySelectors) {
          const element = await page.$(selector)
          if (element) {
            isBackInLobby = true
            break
          }
        }
        
        if (isBackInLobby) {
          console.log(
            `🚨 [${BOT_ID}] Bot is back in Teams lobby/join screen. Stopping recording...`,
          )
          await stopMeetBot()
          break
        }

        // Also check if page redirected to a join URL (sign of being kicked)
        const currentUrl = page.url()
        if (currentUrl.includes('/join/') || currentUrl.includes('/meeting/join')) {
          console.log(
            `🚨 [${BOT_ID}] Bot was redirected to join URL. Stopping recording...`,
          )
          await stopMeetBot()
          break
        }
      } else if (platform === 'zoom') {
        // Zoom specific checks - detect meeting end/removal
        
        // Check for Zoom removal/end messages
        const removalMessages = [
          'The meeting has ended',
          'meeting has ended',
          'You have been removed',
          'removed from the meeting',
          'The host has ended the meeting',
          'Meeting ended by host',
          'Connection lost',
          'Reconnecting',
          'Unable to connect'
        ]
        
        const pageText = await safePageEvaluate<string>(page, () => document.body.innerText)
        
        // ✅ **ZOOM FIX**: Handle null result from transient CDP errors gracefully
        // Don't immediately stop - just skip this check and try again next iteration
        if (pageText === null) {
          console.log(`⚠️ [${BOT_ID}] Failed to check page text due to transient CDP error - skipping check, will retry`)
          await delay(5000)
          continue
        }
        
        const isRemoved = removalMessages.some(msg => pageText.toLowerCase().includes(msg.toLowerCase()))
        
        if (isRemoved) {
          console.log(
            `🚨 [${BOT_ID}] Bot has been removed from Zoom meeting or meeting ended. Stopping recording...`,
          )
          await stopMeetBot()
          break
        }

        // Check if we're back at join screen - ULTRA SPECIFIC: Prevent false positives
        // FIRST: Quick check if we're clearly in an active meeting
        const activeMeetingCheck = await safePageEvaluate<boolean>(page, () => {
          const hasActiveElements = 
            !!document.querySelector('[aria-label*="unmute"]') ||
            !!document.querySelector('[aria-label*="start my video"]') ||
            !!document.querySelector('[aria-label*="stop my video"]') ||
            !!document.querySelector('[class*="participant"]') ||
            !!document.querySelector('[class*="roster"]') ||
            document.querySelectorAll('video').length > 0 ||
            document.title.toLowerCase().includes('my meeting') ||
            document.body.innerText.toLowerCase().includes('participants')
          
          return hasActiveElements
        })
        
        // Handle null result from CDP errors
        if (activeMeetingCheck === null) {
          console.log(`⚠️ [${BOT_ID}] Failed to check active meeting status due to CDP error - stopping bot for safety`)
          await stopMeetBot()
          break
        }
        
        // If we have clear signs of an active meeting, DON'T check for pre-join elements
        if (activeMeetingCheck) {
          console.log(`✅ [${BOT_ID}] Active meeting elements detected - skipping pre-join check`)
        } else {
          // Only check for pre-join if we don't have active meeting signs
          console.log(`🔍 [${BOT_ID}] No active meeting elements - checking for pre-join state`)
          
          // VERY SPECIFIC pre-join detection - only the most obvious ones
          const criticalPreJoinSelectors = [
            'button.preview-join-button', // THE specific pre-join button
            '#input-for-name', // Name input field (only on pre-join)
          ]
          
          let isBackAtPreJoin = false
          for (const selector of criticalPreJoinSelectors) {
            const element = await page.$(selector)
            if (element) {
              console.log(`🔍 [${BOT_ID}] Detected CRITICAL pre-join element: ${selector}`)
              isBackAtPreJoin = true
              break
            }
          }
          
          // Additional STRICT check for pre-join specific text/state
          if (!isBackAtPreJoin) {
            const isPreJoinState = await safePageEvaluate<boolean>(page, () => {
              const bodyText = document.body.innerText.toLowerCase()
              const title = document.title.toLowerCase()
              
              // Very specific pre-join indicators
              const hasPreJoinText = 
                bodyText.includes('enter your name') ||
                (title.includes('zoom meeting on web') && bodyText.includes('your name'))
              
              // Double-check we don't have meeting elements
              const hasActiveMeetingElements = 
                !!document.querySelector('[aria-label*="unmute"]') ||
                !!document.querySelector('[aria-label*="start my video"]') ||
                !!document.querySelector('[class*="participant"]') ||
                document.querySelectorAll('video').length > 0
              
              return hasPreJoinText && !hasActiveMeetingElements
            })
            
            if (isPreJoinState) {
              console.log(`🔍 [${BOT_ID}] Detected pre-join state via STRICT text analysis`)
              isBackAtPreJoin = true
            }
          }
          
          if (isBackAtPreJoin) {
            console.log(
              `🚨 [${BOT_ID}] Bot is back at Zoom pre-join screen. Stopping recording...`,
            )
            await stopMeetBot()
            break
          }
        }

        // Check for connection issues - FIXED: More specific URL detection
        const currentUrl = page.url()
        
        // Only trigger if we're ACTUALLY back at a join page, not just because URL contains '/join'
        // Zoom web client URLs naturally contain '/join' even when in meeting
        const isActuallyBackAtJoin = 
          currentUrl.includes('/launch') || // Zoom launcher page
          (currentUrl.includes('zoom.us/j/') && !currentUrl.includes('/wc/')) || // Direct join URL without web client
          currentUrl.includes('/start/') || // Starting a meeting page
          currentUrl.endsWith('/join') || // Ends with join (not part of path)
          currentUrl.includes('signin') || // Sign-in page
          currentUrl.includes('login') // Login page
        
        if (isActuallyBackAtJoin) {
          console.log(
            `🚨 [${BOT_ID}] Bot was redirected away from Zoom meeting (URL: ${currentUrl}). Stopping recording...`,
          )
          await stopMeetBot()
          break
        }
      }
    } catch (err) {
      console.error(`[${BOT_ID}] Error checking meeting status:`, err)
    }

    await delay(5000) // Check every 5 seconds (less aggressive than 1 second)
  }
}

// ✅ **Monitor Participants and Stop if Only Bot is Left**
export function monitorParticipants(page: Page) {
  if (!page) {
    console.error(
      `❌ [${BOT_ID}] monitorParticipants: Page object is undefined.`,
    )
    return
  }

  // Detect platform
  const currentUrl = page.url()
  const platform = detectMeetingPlatform(currentUrl)

  const participantCheckInterval = setInterval(async () => {
    //console.log('🔄 Running participant check...')
    try {
      // **Prevent execution if stopMeetBot is already running**
      if (state.isClosing) {
        console.log(
          `⚠️ [${BOT_ID}] Bot is already stopping. Exiting participant monitoring.`,
        )
        clearInterval(participantCheckInterval)
        return
      }

      // Check if the page is still open before evaluating
      if (page.isClosed()) {
        console.log(
          `🛑 [${BOT_ID}] Page is closed. Stopping participant monitoring.`,
        )
        clearInterval(participantCheckInterval)
        
        // ✅ **CRITICAL FIX**: Call stopMeetBot to ensure proper state cleanup
        if (state.isBotRunning) {
          console.log(`🔄 [${BOT_ID}] Page closed - triggering bot stop to clean up state`)
          await stopMeetBot()
        }
        return
      }

      let participantCount = null

      if (platform === 'google-meet') {
        participantCount = await page.evaluate(() => {
          // Strategy 1: Original selector
          const participantElement = document.querySelector('.gFyGKf.BN1Lfc .uGOf1d')
          if (participantElement instanceof HTMLElement) {
            const count = Number.parseInt(participantElement.innerText.trim(), 10)
            if (!isNaN(count)) return count
          }
          
          // Strategy 2: Look for participant count in various locations
          const countStrategies = [
            // Look for participant count indicators
            () => {
              const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
              for (const button of buttons) {
                const text = button.textContent || button.getAttribute('aria-label') || ''
                if (text.includes('participant') || text.includes('people')) {
                  const match = text.match(/(\d+)/)
                  if (match) return parseInt(match[1], 10)
                }
              }
              return null
            },
            // Count actual participant elements (excluding self)
            () => {
              const participants = Array.from(document.querySelectorAll('[data-participant-id]:not([data-self])'))
              return participants.length > 0 ? participants.length + 1 : null // +1 for self
            },
            // Look for participant tiles
            () => {
              const tiles = Array.from(document.querySelectorAll('div[jsname="E2KThb"]'))
              return tiles.length > 0 ? tiles.length : null
            },
            // Check if we're in an active meeting (has leave button)
            () => {
              const leaveButton = document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
              return leaveButton ? 2 : null // Assume at least 2 people if leave button exists
            }
          ]
          
          for (const strategy of countStrategies) {
            const count = strategy()
            if (count !== null && count > 0) {
              console.log(`🔍 Participant count detected: ${count}`)
              return count
            }
          }
          
          console.log('⚠️ Could not detect participant count with any strategy')
          return null
        })
      } else if (platform === 'teams') {
        participantCount = await safePageEvaluate<number | null>(page, () => {
          // Strategy 1: Look for participant count in roster
          const strategies = [
            () => {
              const rosterButton = document.querySelector('[data-tid="roster-button"], [aria-label*="participant"], [aria-label*="people"]')
              if (rosterButton) {
                const text = rosterButton.textContent || rosterButton.getAttribute('aria-label') || ''
                const match = text.match(/(\d+)/)
                return match ? parseInt(match[1], 10) : null
              }
              return null
            },
            () => {
              // Strategy 2: Count participant items in opened roster
              const participantItems = document.querySelectorAll('[data-tid="participant-item"], .participant-item')
              return participantItems.length > 0 ? participantItems.length : null
            },
            () => {
              // Strategy 3: Look for participant count in call info
              const callInfo = document.querySelector('[class*="participant-count"], [aria-label*="participant count"]')
              if (callInfo) {
                const text = callInfo.textContent || callInfo.getAttribute('aria-label') || ''
                const match = text.match(/(\d+)/)
                return match ? parseInt(match[1], 10) : null
              }
              return null
            },
            () => {
              // Strategy 4: Count visible participant elements
              const visibleParticipants = Array.from(document.querySelectorAll('[class*="participant"], [class*="member"]'))
                .filter(el => {
                  const style = window.getComputedStyle(el)
                  return style.display !== 'none' && style.visibility !== 'hidden'
                })
              return visibleParticipants.length > 0 ? visibleParticipants.length : null
            }
          ]
          
          for (const strategy of strategies) {
            const count = strategy()
            if (count !== null && count > 0) {
              return count
            }
          }
          return null
        })
      } else if (platform === 'zoom') {
        participantCount = await safePageEvaluate<number | null>(page, () => {
          // Strategy 1: Look for participant count in participants panel button
          const strategies = [
            () => {
              const participantButton = document.querySelector('[aria-label*="participant"], [aria-label*="Participant"], button[aria-label*="people"]')
              if (participantButton) {
                const text = participantButton.textContent || participantButton.getAttribute('aria-label') || ''
                const match = text.match(/(\d+)/)
                return match ? parseInt(match[1], 10) : null
              }
              return null
            },
            () => {
              // Strategy 2: Count visible video tiles
              const videoTiles = document.querySelectorAll('[class*="video-tile"], [class*="participant"], [data-participant-id]')
              const visibleTiles = Array.from(videoTiles).filter(tile => {
                const style = window.getComputedStyle(tile)
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
              })
              return visibleTiles.length > 0 ? visibleTiles.length : null
            },
            () => {
              // Strategy 3: Look for participant list items
              const participantItems = document.querySelectorAll('[class*="participant-item"], [class*="attendee"], li[role="listitem"]')
              return participantItems.length > 0 ? participantItems.length : null
            },
            () => {
              // Strategy 4: Look for specific Zoom participant indicators
              const zoomParticipants = document.querySelectorAll('[data-testid*="participant"], [data-automation-id*="participant"]')
              return zoomParticipants.length > 0 ? zoomParticipants.length : null
            },
            () => {
              // Strategy 5: Check footer or header for participant count
              const footerHeader = document.querySelector('footer, header, [class*="footer"], [class*="header"]')
              if (footerHeader) {
                const text = footerHeader.textContent || ''
                const match = text.match(/(\d+)\s*participants?/i)
                return match ? parseInt(match[1], 10) : null
              }
              return null
            }
          ]
          
          for (const strategy of strategies) {
            const count = strategy()
            if (count !== null && count > 0) {
              return count
            }
          }
          return null
        })
      }

      // IMPROVED LOGIC: Don't stop if we're actively detecting speakers
      // Check if we have active speakers (more reliable than participant count for Teams)
      let activeSpeakers: string[] = []
      try {
        activeSpeakers = await getActiveSpeakers(page)
        // Filter out bot name
        activeSpeakers = activeSpeakers.filter(speaker => speaker !== state.botName && speaker.trim() !== '')
      } catch (err) {
        console.log(`⚠️ [${BOT_ID}] Could not get active speakers for participant check: ${err}`)
      }

      // ✅ **Handle CDP errors**: If participantCount is null due to CDP errors, we should be cautious
      // Check if it's due to a CDP connection issue by verifying browser state
      // Only apply this safety check for Zoom and Teams, not Google Meet
      if (platform !== 'google-meet' && participantCount === null && (!state.activeBrowser || !state.activeBrowser.isConnected() || page.isClosed())) {
        console.log(`⚠️ [${BOT_ID}] Participant count null due to browser/CDP issues - stopping bot for safety`)
        await stopMeetBot()
        return
      }

      // Only consider stopping if BOTH conditions are true:
      // 1. Low/null participant count AND 
      // 2. No active speakers detected
      // 3. Bot has been in meeting for at least 2 minutes (grace period)
      const hasActiveSpeakers = activeSpeakers.length > 0
      const lowParticipantCount = participantCount === null || participantCount === 1
      const hasBeenInMeetingLongEnough = state.hasJoined && (Date.now() - (state.joinedAt || Date.now())) >= 120000 // 2 minutes
      
      if (lowParticipantCount && !hasActiveSpeakers && hasBeenInMeetingLongEnough) {
        if (Date.now() - lastParticipantCheck >= 60000) {
          // ✅ **CRITICAL FIX**: Before stopping, double-check if we're actually in waiting room
          console.log(`⚠️ [${BOT_ID}] About to stop due to no participants - double-checking if we're still in waiting room...`)
          
          // ✅ **ENHANCED**: Early exit if bot has been flagged as not running due to CDP issues
          if (!state.isBotRunning) {
            console.log(`🚪 [${BOT_ID}] Bot flagged as not running - exiting participant monitoring`)
            return
          }
          
          let isStillWaiting: boolean | null = false
          
          if (platform === 'google-meet') {
            // For Google Meet: Use direct evaluation (to preserve audio quality)
            try {
              isStillWaiting = await page.evaluate(() => {
                // Check for visible waiting room indicators
                const bodyText = document.body.innerText.toLowerCase()
                const hasWaitingText = 
                  bodyText.includes('asking to join') ||
                  bodyText.includes('waiting for the host') ||
                  bodyText.includes('waiting to join') ||
                  bodyText.includes('waiting for someone to let you in') ||
                  bodyText.includes('waiting for the meeting to start') ||
                  bodyText.includes('waiting to be admitted')
                
                const askToJoinElement = document.querySelector('span[jsname="V67aGc"].UywwFc-vQzf8d')
                const hasVisibleAskToJoinButton = askToJoinElement ? 
                  (askToJoinElement.getBoundingClientRect().width > 0 && 
                   askToJoinElement.getBoundingClientRect().height > 0 &&
                   window.getComputedStyle(askToJoinElement).display !== 'none' &&
                   window.getComputedStyle(askToJoinElement).visibility !== 'hidden') : false
                
                // Check for actual meeting indicators
                const hasOtherParticipants = document.querySelectorAll('[data-participant-id]:not([data-self])').length > 0
                const hasLeaveButton = !!document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
                const hasMoreOptionsMenu = !!document.querySelector('[aria-label*="More options"], [aria-label*="More actions"]')
                const hasActiveMeetingContent = hasOtherParticipants || hasLeaveButton || hasMoreOptionsMenu
                
                console.log('🔍 Stop prevention check:')
                console.log(`  - Waiting text: ${hasWaitingText}`)
                console.log(`  - Ask to join button (visible): ${hasVisibleAskToJoinButton}`)
                console.log(`  - Meeting content: ${hasActiveMeetingContent}`)
                console.log(`  - Body snippet: "${bodyText.substring(0, 300)}"`)
                
                const stillWaiting = (hasWaitingText || hasVisibleAskToJoinButton) && !hasActiveMeetingContent
                return stillWaiting
              })
            } catch (error) {
              console.log(`⚠️ [${BOT_ID}] Google Meet waiting room check failed, assuming not waiting`)
              isStillWaiting = false
            }
          } else {
            // For Zoom/Teams: Use safe evaluation with CDP error protection  
            isStillWaiting = await safePageEvaluate<boolean>(page, () => {
              // Check for visible waiting room indicators (Zoom/Teams)
              const bodyText = document.body.innerText.toLowerCase()
              const hasWaitingText = 
                bodyText.includes('asking to join') ||
                bodyText.includes('waiting for the host') ||
                bodyText.includes('waiting to join') ||
                bodyText.includes('waiting for someone to let you in') ||
                bodyText.includes('waiting for the meeting to start') ||
                bodyText.includes('waiting to be admitted')
              
              const askToJoinElement = document.querySelector('span[jsname="V67aGc"].UywwFc-vQzf8d')
              const hasVisibleAskToJoinButton = askToJoinElement ? 
                (askToJoinElement.getBoundingClientRect().width > 0 && 
                 askToJoinElement.getBoundingClientRect().height > 0 &&
                 window.getComputedStyle(askToJoinElement).display !== 'none' &&
                 window.getComputedStyle(askToJoinElement).visibility !== 'hidden') : false
              
              // Check for actual meeting indicators
              const hasOtherParticipants = document.querySelectorAll('[data-participant-id]:not([data-self])').length > 0
              const hasLeaveButton = !!document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
              const hasMoreOptionsMenu = !!document.querySelector('[aria-label*="More options"], [aria-label*="More actions"]')
              const hasActiveMeetingContent = hasOtherParticipants || hasLeaveButton || hasMoreOptionsMenu
              
              console.log('🔍 Stop prevention check:')
              console.log(`  - Waiting text: ${hasWaitingText}`)
              console.log(`  - Ask to join button (visible): ${hasVisibleAskToJoinButton}`)
              console.log(`  - Meeting content: ${hasActiveMeetingContent}`)
              console.log(`  - Body snippet: "${bodyText.substring(0, 300)}"`)
              
              const stillWaiting = (hasWaitingText || hasVisibleAskToJoinButton) && !hasActiveMeetingContent
              return stillWaiting
            })
          }
          
          // If evaluation failed (returned null), we should stop the bot to prevent hanging
          // Only apply this safety check for Zoom and Teams, not Google Meet
          if (platform !== 'google-meet' && isStillWaiting === null) {
            console.log(`⚠️ [${BOT_ID}] Unable to check waiting room status due to CDP error - stopping bot for safety`)
            await stopMeetBot()
            return
          }
          
          if (isStillWaiting) {
            console.log(`🚪 [${BOT_ID}] Bot is still in waiting room - NOT stopping, continuing to wait...`)
            // Reset the timer to continue waiting
            lastParticipantCheck = Date.now()
            return
          }
          
          // ✅ **FINAL SAFETY CHECK**: Verify we're not in an active meeting by checking UI elements
          const hasActiveMeetingUI = await page.evaluate(() => {
            // Check for meeting control buttons (leave, mute, camera, etc.)
            const leaveButton = document.querySelector('[aria-label*="Leave call"], [aria-label*="Leave meeting"], [data-tooltip*="Leave"]')
            const muteButton = document.querySelector('[aria-label*="Mute"], [aria-label*="microphone"]')
            const cameraButton = document.querySelector('[aria-label*="camera"], [aria-label*="video"]')
            const moreOptionsButton = document.querySelector('[aria-label*="More options"], [aria-label*="More actions"]')
            
            const hasControls = !!(leaveButton || muteButton || cameraButton || moreOptionsButton)
            
            // Check for meeting content area
            const meetingContent = document.querySelector('[data-allocation-index], .R6Lfte, .KjwKEb')
            const hasMeetingContent = !!meetingContent
            
            console.log(`🔍 Meeting UI check: controls=${hasControls}, content=${hasMeetingContent}`)
            return hasControls && hasMeetingContent
          })
          
          if (hasActiveMeetingUI) {
            console.log(`✅ [${BOT_ID}] Active meeting UI detected - bot is in valid meeting, NOT stopping despite low participant count`)
            lastParticipantCheck = Date.now() // Reset timer
            return
          }
          
          console.log(
            `⏳ [${BOT_ID}] No participants AND no speakers detected for 1 minute. Stopping Meet Bot...`,
          )
          console.log(`📊 [${BOT_ID}] Final check - Participant count: ${participantCount}, Active speakers: ${activeSpeakers.length}`)

          clearInterval(participantCheckInterval)

          // **Give the system a moment before stopping**
          setTimeout(async () => {
            console.log(`🛑 [${BOT_ID}] Call stop Meet bot 🛑`)
            await stopMeetBot()
            // **Set state to prevent duplicate stop calls**
            state.isClosing = true
          }, 2000)
        }
      } else {
        // Reset the timer if we have participants OR speakers
        lastParticipantCheck = Date.now()
        
        // Log why we're not stopping (for debugging)
        if (lowParticipantCount && hasActiveSpeakers) {
          console.log(`✅ [${BOT_ID}] Low participant count (${participantCount}) but active speakers detected (${activeSpeakers.join(', ')}) - continuing...`)
        } else if (lowParticipantCount && !hasBeenInMeetingLongEnough) {
          const timeInMeeting = state.joinedAt ? Date.now() - state.joinedAt : 0
          console.log(`✅ [${BOT_ID}] Low participant count but within grace period (${Math.round(timeInMeeting/1000)}s in meeting) - continuing...`)
        } else if (!lowParticipantCount) {
          console.log(`✅ [${BOT_ID}] Good participant count (${participantCount}) - continuing...`)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [${BOT_ID}] Error monitoring participants:`, errorMessage)
      
      // ✅ **Handle CDP Protocol Errors**: If we get CDP errors, stop the bot safely
      if (
        errorMessage.includes('Protocol error') || 
        errorMessage.includes('Session closed') || 
        errorMessage.includes('Target closed') ||
        errorMessage.includes('Execution context was destroyed') ||
        errorMessage.includes('Cannot find context with specified id')
      ) {
        console.log(`🛑 [${BOT_ID}] Browser context destroyed or CDP connection lost during participant monitoring - stopping bot for safety`)
        clearInterval(participantCheckInterval)
        if (state.isBotRunning) {
          stopMeetBot().catch(err => console.error('Error stopping bot:', err))
        }
        return
      }
    }
  }, 30000) // Check every 30 seconds
}

// ✅ **Monitor Active Speaker**
export async function monitorSpeakers(page: Page) {
  try {
    console.log(`🎭 [${BOT_ID}] ========== MONITOR SPEAKERS STARTED ==========`)
    let lastSpeakers = [] as string[]
    
    // ✅ **ZOOM OPTIMIZATION**: Platform-specific initialization
    const currentUrl = page.url()
    const platform = detectMeetingPlatform(currentUrl)
    
    if (platform === 'zoom') {
      // ✅ **ZOOM FAST PATH**: Skip visual participant detection entirely
      // Zoom uses Assembly.ai audio-based speaker detection which is already working
      // Participants will be discovered from transcripts as they speak
      console.log(`[${BOT_ID}] 🚀 [ZOOM] Using audio-based speaker detection - skipping visual panel setup`)
      console.log(`[${BOT_ID}] 🚀 [ZOOM] Speakers will be detected from audio transcripts automatically`)
      
      // Initialize empty roster - will be populated from transcripts
      state.participantRoster = new Map()
      state.lastParticipantRosterUpdate = Date.now()
      
      console.log(`[${BOT_ID}] ✅ [ZOOM] Speaker monitoring initialized (audio-based mode)`)
      
      // Skip all the panel opening and stabilization logic below
      // Just jump straight to the main monitoring loop
    } else {
      // Google Meet/Teams need visual participant detection
      console.log(`[${BOT_ID}] Waiting for UI to fully render...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      console.log(`[${BOT_ID}] UI load complete`)
    
      // Open participant panel and verify it's populated
      console.log(`[${BOT_ID}] Opening participants panel...`)
      let panelPopulated = false
      
      for (let panelAttempt = 1; panelAttempt <= 3; panelAttempt++) {
        try {
          await ensureParticipantsPanelOpen(page)
          await new Promise(resolve => setTimeout(resolve, 2000))
        
        const panelStatus = await safePageEvaluate<{isOpen: boolean, itemCount: number}>(page, () => {
          const participantPanels = [
            document.querySelector('[role="list"][aria-label*="articipant"]'),
            document.querySelector('[role="list"][aria-label*="eople"]'),
            document.querySelector('.participant-list'),
            document.querySelector('[data-participant-list]')
          ]
          
          let itemCount = 0
          let foundPanel = false
          
          for (const panel of participantPanels) {
            if (panel) {
              foundPanel = true
              const listItems = panel.querySelectorAll('[role="listitem"]')
              itemCount = listItems.length
              if (itemCount > 0) break
            }
          }
          
          return { isOpen: foundPanel, itemCount }
        })
        
        console.log(`[${BOT_ID}] Panel status (attempt ${panelAttempt}): ${panelStatus?.isOpen ? 'OPEN' : 'CLOSED'}, Items: ${panelStatus?.itemCount || 0}`)
        
        if (panelStatus && panelStatus.isOpen && panelStatus.itemCount > 0) {
          panelPopulated = true
          console.log(`[${BOT_ID}] Participant panel populated with ${panelStatus.itemCount} items`)
          break
        } else if (panelAttempt < 3) {
          console.log(`[${BOT_ID}] Panel not populated, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (panelError) {
        console.error(`[${BOT_ID}] Error verifying panel (attempt ${panelAttempt}):`, panelError)
      }
    }
    
      console.log(`[${BOT_ID}] Panel verification: ${panelPopulated ? 'Complete' : 'Incomplete'}`)
      
      // Build roster with stabilization check
      console.log(`[${BOT_ID}] Building participant roster...`)
      let initialRoster = new Map()
      let stableParticipantCount = 0
      let stabilizationAttempts = 0
      const maxStabilizationAttempts = 8
    
    try {
      for (let attempt = 1; attempt <= maxStabilizationAttempts; attempt++) {
        console.log(`[${BOT_ID}] Detection attempt ${attempt}/${maxStabilizationAttempts}...`)
        
        try {
          const shouldOpenPanel = (attempt <= 3)
          initialRoster = await buildParticipantRoster(page, shouldOpenPanel)
          
          const detectedCount = initialRoster.size
          console.log(`[${BOT_ID}] Attempt ${attempt}: ${detectedCount} participants detected`)
          
          if (detectedCount > 0) {
            console.log(`   Participants: ${Array.from(initialRoster.keys()).join(', ')}`)
            
            // Check if participant count is stable
            if (detectedCount === stableParticipantCount) {
              stabilizationAttempts++
              console.log(`[${BOT_ID}] Count stable (${stabilizationAttempts}/3): ${detectedCount} participants`)
              
              if (stabilizationAttempts >= 3) {
                console.log(`[${BOT_ID}] Participant list stabilized at ${detectedCount} participants`)
                break
              }
            } else {
              if (stableParticipantCount > 0) {
                console.log(`[${BOT_ID}] Count changed: ${stableParticipantCount} -> ${detectedCount}`)
              }
              stableParticipantCount = detectedCount
              stabilizationAttempts = 1
            }
          } else {
            console.log(`[${BOT_ID}] No participants detected on attempt ${attempt}`)
            stabilizationAttempts = 0
          }
          
        } catch (rosterError) {
          console.error(`[${BOT_ID}] Error in buildParticipantRoster:`, rosterError)
        }
        
        if (attempt < maxStabilizationAttempts) {
          const waitTime = attempt <= 3 ? 2000 : 1500
          console.log(`[${BOT_ID}] Waiting ${waitTime/1000}s before next check...`)
          
          if (attempt % 3 === 0) {
            try {
              await ensureParticipantsPanelOpen(page)
            } catch (e) {
              console.error(`[${BOT_ID}] Error reopening panel:`, e)
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
      
      // Log final status
      if (initialRoster.size === 0) {
        console.log(`[${BOT_ID}] Failed to detect participants after ${maxStabilizationAttempts} attempts`)
        console.log(`[${BOT_ID}] Will rely on real-time transcript name extraction`)
      } else if (stabilizationAttempts < 3) {
        console.log(`[${BOT_ID}] Participant list did not fully stabilize, proceeding with ${initialRoster.size} participants`)
      }
      
      console.log(`[${BOT_ID}] Participant detection complete`)
      console.log(`[${BOT_ID}] Final roster: ${initialRoster.size} participants`)
      if (initialRoster.size > 0) {
        console.log(`[${BOT_ID}] Detected: ${Array.from(initialRoster.keys()).join(', ')}`)
      }
    
    // If visual detection failed but we have some transcripts, try extracting names
    if (initialRoster.size === 0 && state.transcriptionLog.length > 0) {
      console.log(`⚠️ [${BOT_ID}] Visual detection failed, trying to extract names from transcript...`)
      const extractedNames = extractNamesFromTranscript(state.transcriptionLog)
      
      if (extractedNames.length > 0) {
        console.log(`✅ [${BOT_ID}] Extracted ${extractedNames.length} names from transcript:`, extractedNames)
        const now = Date.now()
        extractedNames.forEach(name => {
          // Skip generic labels - we only want real participant names
          if (name.startsWith('Unknown Speaker')) {
            console.log(`🚫 [${BOT_ID}] Skipping generic label: "${name}"`)
            return
          }
          initialRoster.set(name, {
            name,
            lastActive: now,
            activityCount: 0
          })
        })
      }
    }
    
    state.participantRoster = initialRoster
    state.lastParticipantRosterUpdate = Date.now()
    
    // Set initial speaker from roster if available
    if (initialRoster.size > 0) {
      const firstParticipant = Array.from(initialRoster.keys()).find(name => name !== state.botName)
      if (firstParticipant) {
        state.currentSpeaker = firstParticipant
        console.log(`🎤 [${BOT_ID}] Initial speaker from roster: ${firstParticipant}`)
      }
    }
    } catch (err) {
      console.log(`⚠️ [${BOT_ID}] Could not build initial roster: ${err}`)
    }
    
    // Try to get initial active speakers
    try {
      const initialSpeakers = await getActiveSpeakers(page)
      if (initialSpeakers.length > 0) {
        const firstSpeaker = initialSpeakers.find(name => name !== state.botName)
        if (firstSpeaker) {
          state.currentSpeaker = firstSpeaker
          console.log(`🎤 [${BOT_ID}] Initial active speaker detected: ${firstSpeaker}`)
          
          // ✅ RE-ENABLED: Log speaker change for hybrid audio-visual approach
          const changeTimestamp = Date.now()
          state.speakerChangeLog.push({
            timestamp: changeTimestamp,
            speaker: firstSpeaker,
            isoTimestamp: new Date(changeTimestamp).toISOString()
          })
          console.log(`📝 [${BOT_ID}] Logged initial speaker: ${firstSpeaker}`)
          
          // Update roster with this speaker
          if (state.participantRoster.has(firstSpeaker)) {
            const participant = state.participantRoster.get(firstSpeaker)!
            participant.lastActive = Date.now()
            participant.activityCount++
          }
        }
      }
    } catch (err) {
      console.log(`⚠️ [${BOT_ID}] Could not detect initial active speakers: ${err}`)
    }
  } // End of Google Meet/Teams platform-specific setup
  
  // Main monitoring loop (runs for all platforms)
  while (state.isBotRunning) {
    // ✅ **CRITICAL**: Immediate exit if bot flagged as not running (race condition protection)
    if (!state.isBotRunning || isEmergencyShutdown) {
      console.log(`🚪 [${BOT_ID}] Bot flagged as not running or emergency shutdown - exiting speaker monitoring`)
      return
    }
    
    if (page.isClosed()) {
      console.log(
        `🛑 [${BOT_ID}] monitorSpeakers: Page is closed. Stopping speaker monitoring.`,
      )
      break
    }

    // ✅ **IMPROVED: Rebuild roster periodically (every 30 seconds)**
    let now = Date.now()
    if (!state.lastParticipantRosterUpdate || now - state.lastParticipantRosterUpdate > 30000) {
      try {
        console.log(`🔄 [${BOT_ID}] Refreshing participant roster...`)
        
        // Try to ensure panel is open (in case it was closed)
        if (state.participantRoster.size === 0) {
          console.log(`⚠️ [${BOT_ID}] Roster is empty, attempting to open participants panel...`)
          await ensureParticipantsPanelOpen(page)
        }
        
        // Don't open panel during periodic refresh (too disruptive)
        const newRoster = await buildParticipantRoster(page, false)
        
        // If roster is still empty, try to extract names from recent transcriptions
        if (newRoster.size === 0 && state.transcriptionLog.length > 0) {
          console.log(`⚠️ [${BOT_ID}] Visual detection failed, trying to extract names from transcript...`)
          const extractedNames = extractNamesFromTranscript(state.transcriptionLog)
          
          if (extractedNames.length > 0) {
            console.log(`✅ [${BOT_ID}] Extracted ${extractedNames.length} names from transcript:`, extractedNames)
            extractedNames.forEach(name => {
              newRoster.set(name, {
                name,
                lastActive: now,
                activityCount: 0
              })
            })
          }
        }
        
        // Merge with existing roster (preserve activity counts)
        newRoster.forEach((value, key) => {
          if (state.participantRoster.has(key)) {
            // Keep existing activity data, just update the presence
            const existing = state.participantRoster.get(key)!
            value.activityCount = existing.activityCount
            value.lastActive = Math.max(existing.lastActive, value.lastActive)
          }
          state.participantRoster.set(key, value)
        })
        
        state.lastParticipantRosterUpdate = now
        console.log(`✅ [${BOT_ID}] Roster refreshed: ${state.participantRoster.size} participants`)
      } catch (err) {
        console.log(`⚠️ [${BOT_ID}] Error refreshing roster: ${err}`)
      }
    }

    try {
      const speakers = await getActiveSpeakers(page) // Get all active speakers

      if (speakers.length > 0) {
        lastSpeakers = [...lastSpeakers, ...speakers].slice(-5) // Keep last 5 detections
        
        // ✅ **IMPORTANT: Update roster for ALL detected active speakers, not just the current one**
        // This tracks who is visually active even if they're not selected as "current speaker"
        now = Date.now()
        speakers.forEach(speaker => {
          if (speaker && speaker !== state.botName) {
            if (state.participantRoster.has(speaker)) {
              const participant = state.participantRoster.get(speaker)!
              participant.lastActive = now
            } else {
              // New speaker detected - add to roster
              state.participantRoster.set(speaker, {
                name: speaker,
                lastActive: now,
                activityCount: 0
              })
              console.log(`➕ [${BOT_ID}] Added new active participant to roster: ${speaker}`)
            }
          }
        })
        
        const newSpeaker = lastSpeakers[lastSpeakers.length - 1] // Most recent
        
        // Only update if we have a real speaker name (not bot name)
        if (newSpeaker && newSpeaker !== state.botName && newSpeaker !== state.currentSpeaker) {
          const changeTimestamp = Date.now()
          console.log(`👁️ [${BOT_ID}] Visual speaker changed: ${state.currentSpeaker} → ${newSpeaker}`)
          
          const previousSpeaker = state.currentSpeaker
          state.currentSpeaker = newSpeaker
          state.currentSpeakerStartTime = changeTimestamp
          state.lastSpeakerUpdate = changeTimestamp  // ✅ FIX: Update timestamp so selectSpeakerIntelligently() trusts visual detection
          
          // ✅ **CRITICAL FIX: Log ALL visual speaker changes immediately**
          // Don't wait for speech detection - visual changes ARE the source of truth
          // Filter out invalid speakers and generic labels - we only want real participant names
          const isValidSpeaker = newSpeaker !== 'Unknown' && 
                                newSpeaker !== 'User' && 
                                !/^unknown\s+speaker\s*\d*/i.test(newSpeaker)
          
          if (isValidSpeaker) {
            // ✅ RE-ENABLED: Log speaker change for hybrid audio-visual approach
            // This will be used to cross-reference Assembly.ai timestamps with visual detection
            state.speakerChangeLog.push({
              timestamp: changeTimestamp,
              speaker: newSpeaker,
              isoTimestamp: new Date(changeTimestamp).toISOString()
            })
            
            const isFirstSpeaker = !previousSpeaker || previousSpeaker === 'User'
            if (isFirstSpeaker) {
              console.log(`🎤 [${BOT_ID}] First speaker visually detected: ${newSpeaker}`)
            } else {
              console.log(`🔄 [${BOT_ID}] Visual speaker change detected: ${previousSpeaker} → ${newSpeaker}`)
            }
            console.log(`📝 [${BOT_ID}] Logged speaker change to: ${newSpeaker}`)
          }
          
          // Increment activity count for the selected speaker
          if (state.participantRoster.has(newSpeaker)) {
            const participant = state.participantRoster.get(newSpeaker)!
            participant.activityCount++
          }
        } else if (newSpeaker && newSpeaker !== state.botName) {
          state.currentSpeaker = newSpeaker
          
          // Initialize start time and last update if not set
          if (!state.currentSpeakerStartTime) {
            state.currentSpeakerStartTime = Date.now()
            state.lastSpeakerUpdate = Date.now()  // ✅ FIX: Initialize timestamp
          }
        }
        
        // Only log speaker info every 10 seconds instead of every poll to reduce spam
        now = Date.now()
        if (!state.lastSpeakerLogTime || now - state.lastSpeakerLogTime >= 10000) {
          const rosterList = Array.from(state.participantRoster.keys())
            .filter(name => name !== state.botName)
            .map(name => {
              const p = state.participantRoster.get(name)!
              return `${name}(${p.activityCount})`
            })
            .join(', ')
          
          console.log(
            `🎤 [${BOT_ID}] Active: ${[...new Set(lastSpeakers)].join(', ')} | Current: ${state.currentSpeaker} | Roster: ${rosterList}`,
          )
          state.lastSpeakerLogTime = now
        }
      } else {
        // No active speakers detected via visual indicators
        // Use intelligent selection from roster
        const selection = selectSpeakerIntelligently()
        
        if (selection.speaker !== state.currentSpeaker && selection.confidence > 0.5) {
          console.log(`🔄 [${BOT_ID}] No visual speaker, switching to: ${selection.speaker} (${selection.method})`)
          state.currentSpeaker = selection.speaker
        }
        
        // Don't log "no speakers" too frequently
        const now = Date.now()
        if (!state.lastNoSpeakerLogTime || now - state.lastNoSpeakerLogTime >= 30000) {
          console.log(`🔇 [${BOT_ID}] No active speakers detected visually, using: ${state.currentSpeaker} (${selection.method})`)
          state.lastNoSpeakerLogTime = now
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error(`❌ [${BOT_ID}] monitorSpeakers: Error getting active speakers:`, errorMessage)
      
      // ✅ **Handle CDP Protocol Errors**: If we get CDP errors, stop the monitoring loop
      if (
        errorMessage.includes('Protocol error') || 
        errorMessage.includes('Session closed') || 
        errorMessage.includes('Target closed') ||
        errorMessage.includes('Execution context was destroyed') ||
        errorMessage.includes('Cannot find context with specified id')
      ) {
        console.log(`🛑 [${BOT_ID}] Browser context destroyed or CDP connection lost during speaker monitoring - stopping loop`)
        break
      }
      
      // For other errors, continue after a longer delay
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    // ✅ **IMPROVED: Faster polling for better speaker detection (500ms instead of 2000ms)**
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  } catch (monitorError) {
    console.error(`❌ [${BOT_ID}] FATAL ERROR in monitorSpeakers:`, monitorError)
    console.error(`❌ [${BOT_ID}] Stack trace:`, monitorError instanceof Error ? monitorError.stack : 'No stack trace')
  }
}

// **Helper function for direct chat button clicking**
async function handleDirectChatButtonClick(page: Page, chatButton: any) {
  // Try multiple click methods to ensure it works
  let clickSuccess = false
  
  // Method 1: Standard click
  try {
    await chatButton.click()
    await delay(800)
    
    const newPressed = await safePageEvaluate<boolean>(page, 
      (btn: Element) => btn.getAttribute('aria-pressed') === 'true',
      chatButton,
    )
    
    if (newPressed === true) {
      clickSuccess = true
    }
  } catch (error) {
    // Continue to next method
  }
  
  // Method 2: JavaScript click if standard didn't work
  if (!clickSuccess) {
    try {
      await safePageEvaluate(page, (btn: HTMLElement) => btn.click(), chatButton)
      await delay(800)
      
      const newPressed = await safePageEvaluate<boolean>(page,
        (btn: Element) => btn.getAttribute('aria-pressed') === 'true',
        chatButton,
      )
      
      if (newPressed === true) {
        clickSuccess = true
      }
    } catch (error) {
      // Continue to verification
    }
  }
  
  // **ENHANCED FIX**: Even if aria-pressed didn't change, check if chat panel actually opened
  if (!clickSuccess) {
    const chatPanelAfterClick = await safePageEvaluate<{foundCount: number, hasTextarea: boolean}>(page, () => {
      // More comprehensive chat panel detection
      const indicators = [
        document.querySelector('[data-call-chat="true"]'),
        document.querySelector('[jsname="JSjDVd"]'),
        document.querySelector('.chat-panel'),
        document.querySelector('textarea[aria-label*="message"]'),
        document.querySelector('textarea[placeholder*="message"]'),
        document.querySelector('[aria-label*="chat"]')
      ]
      
      const foundIndicators = indicators.filter(el => el !== null)
      return {
        foundCount: foundIndicators.length,
        hasTextarea: !!document.querySelector('textarea[aria-label*="message"], textarea[placeholder*="message"]')
      }
    })
    
    if (chatPanelAfterClick && (chatPanelAfterClick.hasTextarea || chatPanelAfterClick.foundCount >= 2)) {
      clickSuccess = true
    }
  }
  
  return clickSuccess
}

// **Helper function for dropdown-based chat access**
async function handleDropdownChatAccess(page: Page) {
  // **ENHANCED SELECTORS**: Target main meeting controls, not participant dropdowns
  const moreOptionsSelectors = [
    // Main meeting controls dropdown (bottom toolbar)
    '[data-tooltip="More options"]',
    'button[aria-label="More options"]:not([data-participant-id])',
    'button[aria-label*="More"]:not([data-participant-id])',
    
    // Meeting controls area specific selectors  
    '[jsname="A5il2e"] button[aria-label*="More"]', // Main controls container
    '[data-call-main-controls] button[aria-label*="More"]',
    '[class*="call-controls"] button[aria-label*="More"]',
    
    // Fallback selectors for different UI states
    'button[aria-haspopup="menu"]:not([data-participant-id])',
    'button[data-tooltip*="More"]:not([data-participant-id])',
    
    // Generic selectors as last resort
    'button[aria-label="More options"]',
    'button[aria-haspopup="dialog"]'
  ]
  
  let moreOptionsButton = null
  let foundSelector = ''
  
  for (const selector of moreOptionsSelectors) {
    moreOptionsButton = await page.$(selector)
    if (moreOptionsButton) {
      foundSelector = selector
      break
    }
  }
  
  if (!moreOptionsButton) {
    return false
  }
  
  // **ENHANCED DROPDOWN CLICK LOGIC**
  let dropdownOpened = false
  
  // **METHOD 1: Standard click**
  try {
    await moreOptionsButton.click()
    await delay(800)
    
    const dropdownMenu = await page.$('[role="menu"], [role="listbox"], .dropdown-menu, [data-testid*="menu"], [class*="dropdown"], [class*="menu"]')
    if (dropdownMenu) {
      dropdownOpened = true
    }
  } catch (error) {
    // Continue to next method
  }
  
  // **METHOD 2: JavaScript click if standard failed**
  if (!dropdownOpened) {
    try {
      await safePageEvaluate(page, (btn: HTMLElement) => btn.click(), moreOptionsButton)
      await delay(800)
      
      const dropdownMenu = await page.$('[role="menu"], [role="listbox"], .dropdown-menu, [data-testid*="menu"], [class*="dropdown"], [class*="menu"]')
      if (dropdownMenu) {
        dropdownOpened = true
      }
    } catch (error) {
      // Continue to next method
    }
  }
  
  // **METHOD 3: Page.click with selector**
  if (!dropdownOpened) {
    try {
      await page.click(foundSelector)
      await delay(800)
      
      const dropdownMenu = await page.$('[role="menu"], [role="listbox"], .dropdown-menu, [data-testid*="menu"], [class*="dropdown"], [class*="menu"]')
      if (dropdownMenu) {
        dropdownOpened = true
      }
    } catch (error) {
      // Continue
    }
  }
  
  if (!dropdownOpened) {
    return false
  }
  
  // **ENHANCED CHAT BUTTON SEARCH IN DROPDOWN**
  const chatButtonSelectors = [
    'button[aria-label="Chat with everyone"]',
    'button[aria-label*="Chat"]',
    '[role="menuitem"][aria-label*="Chat"]',
    '[role="menuitem"]:has-text("Chat")',
    'button:has-text("Chat")',
    '[data-testid*="chat"]',
    'li[aria-label*="Chat"]',
    'div[role="button"][aria-label*="Chat"]'
  ]
  
  let chatButton = null
  for (const selector of chatButtonSelectors) {
    try {
      chatButton = await page.$(selector)
      if (chatButton) {
        break
      }
    } catch (e) {
      // Continue searching
    }
  }
  
  if (!chatButton) {
    return false
  }
  
  // Click the chat button found in dropdown
  return await handleDirectChatButtonClick(page, chatButton)
}

// **Helper function for alternative UI layouts**
async function handleAlternativeUISearch(page: Page) {
  // Try various alternative selectors for chat access
  const alternativeSelectors = [
    'button[aria-label*="chat"]',
    'button[title*="chat"]',
    '[data-tooltip*="chat"]',
    'button:contains("Chat")',
    '[role="button"][aria-label*="Chat"]'
  ]
  
  for (const selector of alternativeSelectors) {
    try {
      const button = await page.$(selector)
      if (button) {
        return await handleDirectChatButtonClick(page, button)
      }
    } catch (error) {
      // Continue to next selector
    }
  }
  
  return false
}

export async function openParticipantsPanel(page: Page) {
  try {
    await page.waitForSelector("button[aria-label='People']", {
      timeout: 10000,
    })
    await page.click("button[aria-label='People']")
    console.log(`[${BOT_ID}] Opened participants panel.`)
    return true
  } catch (error) {
    console.error(`[${BOT_ID}] Failed to open participants panel:`, error)
    return false
  }
}

export async function openChatWindow(page: Page) {
  const chatButtonSelector = 'button[aria-label="Chat with everyone"]'

  try {

    // **UI STATE DETECTION** - Check what's currently visible
    const uiState = await safePageEvaluate<any>(page, () => {
      // Look for chat button directly
      const directChatButton = document.querySelector('button[aria-label="Chat with everyone"]') as HTMLElement
      
      // Look for main meeting controls "More options" dropdown (not participant dropdown)
      const moreOptionsSelectors = [
        '[data-tooltip="More options"]',
        'button[aria-label="More options"]:not([data-participant-id])',
        '[jsname="A5il2e"] button[aria-label*="More"]',
        '[data-call-main-controls] button[aria-label*="More"]',
        'button[aria-label="More options"]'
      ]
      
      let moreOptionsButton = null
      let foundSelector = ''
      
      for (const selector of moreOptionsSelectors) {
        moreOptionsButton = document.querySelector(selector) as HTMLElement
        if (moreOptionsButton) {
          foundSelector = selector
          break
        }
      }
      
      // Check if chat panel is already open
      const chatPanel = document.querySelector('[data-call-chat="true"], [jsname="JSjDVd"], .chat-panel')
      
      // Count buttons to understand UI complexity
      const totalButtons = document.querySelectorAll('button').length
      
      // Debug info about found elements
      const debugInfo = {
        foundMoreOptionsSelector: foundSelector,
        moreOptionsButtonClasses: moreOptionsButton ? moreOptionsButton.className : 'none',
        participantDropdowns: document.querySelectorAll('button[data-participant-id][aria-label*="More"]').length
      }
      
      return {
        directChatButton: !!directChatButton,
        directChatButtonVisible: directChatButton ? directChatButton.offsetWidth > 0 && directChatButton.offsetHeight > 0 : false,
        moreOptionsButton: !!moreOptionsButton,
        moreOptionsVisible: moreOptionsButton ? moreOptionsButton.offsetWidth > 0 && moreOptionsButton.offsetHeight > 0 : false,
        chatPanelAlreadyOpen: !!chatPanel,
        chatButtonPressed: directChatButton ? directChatButton.getAttribute('aria-pressed') === 'true' : false,
        totalButtons: totalButtons,
        debugInfo: debugInfo
      }
    })
    
    // **SCENARIO 1: Chat button directly visible**
    if (uiState.directChatButton && uiState.directChatButtonVisible) {
      if (uiState.chatButtonPressed) {
        return true
      } else {
        const chatButton = await page.$(chatButtonSelector)
        if (chatButton) {
          const clickResult = await handleDirectChatButtonClick(page, chatButton)
          
          // **ENHANCED**: Even if click appeared to fail, verify if we can actually send messages
          if (!clickResult) {
            const textarea = await getChatTextarea(page)
            if (textarea) {
              return true
            }
          }
          
          return clickResult
        }
      }
    }
    
    // **SCENARIO 2: Chat button in dropdown**
    else if (uiState.moreOptionsButton) {
      return await handleDropdownChatAccess(page)
    }
    
    // **SCENARIO 3: Alternative UI layout**
    else {
      return await handleAlternativeUISearch(page)
    }

    return false
  } catch (error) {
    console.error(
      '❌ Failed to open chat panel:',
      error instanceof Error ? error.message : error,
    )
    return false
  }
}

export async function getChatTextarea(page: Page) {
  return page.$(
    [
      'textarea[aria-label="Send a message"]',
      'textarea[aria-label="Send a message to everyone"]',
    ].join(', ') as `textarea[${string}]`,
  )
}

export async function sendChatMessage(page: Page, message: string) {
  try {
    console.log(`📝 Sending chat message: "${message}"`)
    
    // Verify chat panel is accessible
    const chatButton = await page.$('button[aria-label="Chat with everyone"]')
    if (chatButton) {
      const chatButtonPressed = await safePageEvaluate<boolean>(page, (btn: Element) => btn.getAttribute('aria-pressed') === 'true', chatButton)
      if (chatButtonPressed === false) {
        console.log('⚠️ Chat panel may not be open - button not pressed')
      }
    }
    
    let textarea = await getChatTextarea(page)
    if (!textarea) {
      throw new Error('❌ Chat input not found. Is the chat panel open?')
    }
    
    // **CRITICAL FIX**: Verify chat panel is still open before typing
    const chatPanelStillOpen = await safePageEvaluate<boolean>(page, () => {
      const indicators = [
        document.querySelector('[data-call-chat="true"]'),
        document.querySelector('[jsname="JSjDVd"]'),
        document.querySelector('.chat-panel'),
        document.querySelector('textarea[aria-label*="message"]'),
        document.querySelector('textarea[placeholder*="message"]')
      ]
      return indicators.some(el => el !== null)
    })
    
    if (chatPanelStillOpen === false) {
      console.log('⚠️ Chat panel closed, attempting to re-open...')
      const reopened = await openChatWindow(page)
      if (!reopened) {
        throw new Error('❌ Chat panel closed and could not be reopened')
      }
      
      textarea = await getChatTextarea(page)
      if (!textarea) {
        throw new Error('❌ Chat textarea not found after reopening panel')
      }
    }
    
    await delay(500) // Wait for UI to stabilize
    
    // Verify textarea is still available
    const textareaActive = await safePageEvaluate<boolean>(page, (el: HTMLElement) => {
      return el && el.isConnected && el.offsetWidth > 0 && el.offsetHeight > 0
    }, textarea)
    
    if (textareaActive === false) {
      textarea = await getChatTextarea(page)
      if (!textarea) {
        throw new Error('❌ Chat textarea became unavailable')
      }
    }
    
    // **CRITICAL FIX**: Monitor chat panel during typing and reopen if it closes
    let typingSuccess = false
    let attempts = 0
    const maxAttempts = 3
    
    while (!typingSuccess && attempts < maxAttempts) {
      attempts++
      
      try {
        // Check if textarea is still available before typing
        const textareaStillExists = await safePageEvaluate<boolean>(page, (el: HTMLTextAreaElement) => {
          return el && el.isConnected && !el.disabled
        }, textarea)
        
        if (textareaStillExists === false) {
          const reopened = await openChatWindow(page)
          if (!reopened) {
            throw new Error('Failed to reopen chat panel')
          }
          textarea = await getChatTextarea(page)
          if (!textarea) {
            throw new Error('Failed to get textarea after reopening')
          }
        }
        
        // **ENHANCED MULTI-METHOD TYPING APPROACH**
        if (textarea) {
          // **METHOD 1: Focus and clear first**
          try {
            
            await textarea.focus()
            await delay(200)
            
                        // Clear any existing text and type message
            await textarea.evaluate((el: HTMLTextAreaElement) => {
              el.value = ''
              el.focus()
              el.dispatchEvent(new Event('input', { bubbles: true }))
              el.dispatchEvent(new Event('change', { bubbles: true }))
            })
            
            await textarea.type(message, { delay: 50 })
    await delay(300)

            // Check if it worked
            let typedText = await textarea.evaluate((el: HTMLTextAreaElement) => el.value)
            if (typedText === message) {
              typingSuccess = true
            } else {
              
              // **METHOD 2: Direct value assignment with events**
              await textarea.evaluate((el: HTMLTextAreaElement, msg: string) => {
                el.focus()
                el.value = msg
                
                // Trigger all necessary events
                el.dispatchEvent(new Event('input', { bubbles: true }))
                el.dispatchEvent(new Event('change', { bubbles: true }))
                el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }))
                el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }))
                
                // Force React/Vue reactivity if present
                const descriptor = Object.getOwnPropertyDescriptor(el, 'value') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')
                if (descriptor && descriptor.set) {
                  descriptor.set.call(el, msg)
                }
              }, message)
              
              await delay(300)
              typedText = await textarea.evaluate((el: HTMLTextAreaElement) => el.value)
              
              if (typedText === message) {
                typingSuccess = true
              } else {
                
                // **METHOD 3: Character-by-character simulation**
                if (attempts === maxAttempts) { // Only try this expensive method on last attempt
                  await textarea.evaluate((el: HTMLTextAreaElement) => {
                    el.focus()
                    el.value = ''
                  })
                  
                  // Type character by character with keyboard events
                  for (const char of message) {
                    await textarea.evaluate((el: HTMLTextAreaElement, character: string) => {
                      const keyEvent = new KeyboardEvent('keydown', { 
                        bubbles: true, 
                        key: character, 
                        charCode: character.charCodeAt(0),
                        keyCode: character.charCodeAt(0)
                      })
                      el.dispatchEvent(keyEvent)
                      
                      el.value += character
                      
                      el.dispatchEvent(new Event('input', { bubbles: true }))
                      
                      const keyUpEvent = new KeyboardEvent('keyup', { 
                        bubbles: true, 
                        key: character, 
                        charCode: character.charCodeAt(0),
                        keyCode: character.charCodeAt(0)
                      })
                      el.dispatchEvent(keyUpEvent)
                    }, char)
                    
                    await delay(50) // Small delay between characters
                  }
                  
                  await delay(300)
                  typedText = await textarea.evaluate((el: HTMLTextAreaElement) => el.value)
                  
                  if (typedText === message) {
                    typingSuccess = true
                  }
                }
              }
            }
            
          } catch (typingError) {
            // Log error only if it's the final attempt
            if (attempts === maxAttempts) {
              console.log(`⚠️ Typing failed:`, typingError instanceof Error ? typingError.message : typingError)
            }
          }
          
          if (!typingSuccess && attempts < maxAttempts) {
            await delay(1000)
          }
          
        } else {
          throw new Error('Textarea became null during typing')
        }
        
      } catch (error) {
        if (attempts === maxAttempts) {
          console.log(`⚠️ Typing attempt failed:`, error instanceof Error ? error.message : error)
        }
        if (attempts < maxAttempts) {
          await delay(1000) // Wait before retry
        }
      }
    }
    
    if (!typingSuccess) {
      throw new Error('Failed to type message after all attempts')
    }

    // **ENHANCED**: Verify chat panel is still open before looking for send button
    const chatPanelOpenBeforeSend = await safePageEvaluate<boolean>(page, () => {
      const indicators = [
        document.querySelector('[data-call-chat="true"]'),
        document.querySelector('[jsname="JSjDVd"]'),
        document.querySelector('.chat-panel'),
        document.querySelector('textarea[aria-label*="message"]')
      ]
      return indicators.some(el => el !== null)
    })
    
    if (chatPanelOpenBeforeSend === false) {
      console.log('⚠️ Chat panel closed after typing, attempting final reopen...')
      const reopened = await openChatWindow(page)
      if (!reopened) {
        throw new Error('Chat panel closed and could not be reopened after typing')
      }
      
      // Re-type the message in the reopened panel
      const newTextarea = await getChatTextarea(page)
      if (newTextarea) {
        await newTextarea.evaluate((el: HTMLTextAreaElement) => {
          el.value = message
          el.dispatchEvent(new Event('input', { bubbles: true }))
        })
        console.log('✅ Message re-entered in reopened chat panel')
      }
    }

        // **ENHANCED SEND BUTTON HANDLING** - Based on actual Google Meet HTML structure
    const sendButtonSelectors = [
      // **PRIMARY**: Exact selectors from actual HTML structure
      'button[jsname="SoqoBf"][aria-label="Send a message"]',
      'button[jsname="SoqoBf"]',
      'button[aria-label="Send a message"][role="button"]',
      'button[data-tooltip-enabled="true"][aria-label="Send a message"]',
      
      // **SECONDARY**: Specific attribute combinations
      'button[jscontroller="PIVayb"][aria-label="Send a message"]',
      'button[class*="pYTkkf-Bz112c"][aria-label="Send a message"]',
      'button[jsaction*="click:h5M12e"][aria-label="Send a message"]',
      
      // **FALLBACK**: General selectors
      'button[aria-label="Send a message"]',
      'button[aria-label*="Send"]',
      'button[data-tooltip*="Send"]',
      '[role="button"][aria-label*="send"]'
    ]
    
    let clickSuccess = false
    let lastError = null
    
    // **METHOD 1: Modern Puppeteer Locator API** (Most robust)
    try {
      for (const selector of sendButtonSelectors) {
        try {
          // First check if element exists
          const elementExists = await page.$(selector)
          if (!elementExists) {
            continue
          }
          
          // Use locator with auto-wait functionality
          await page.locator(selector).setTimeout(3000).click()
          clickSuccess = true
          break
          
        } catch (locatorError) {
          lastError = locatorError
          continue
        }
      }
      
    } catch (error) {
      lastError = error
    }
    
    // **METHOD 2: Traditional ElementHandle approach** (Fallback)
    if (!clickSuccess) {
      try {
        let sendButton = null
        
        // Try to find send button with multiple selectors
        for (const selector of sendButtonSelectors) {
          try {
            sendButton = await page.$(selector)
            if (sendButton) {
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (sendButton) {
          // Check if button is enabled
          const isDisabled = await safePageEvaluate<boolean>(page, (btn: HTMLButtonElement) => btn.disabled, sendButton)

    if (isDisabled === false) {
            // Try standard click first
            try {
      await sendButton.click()
              clickSuccess = true
            } catch (error) {
              // Try JavaScript force click
              try {
                await safePageEvaluate(page, (btn: HTMLElement) => {
                  (btn as HTMLElement).click()
                }, sendButton)
                clickSuccess = true
              } catch (jsError) {
                lastError = jsError
              }
            }
    } else {
            lastError = new Error('Send button is disabled')
          }
        } else {
          lastError = new Error('Send button not found')
        }
        
      } catch (error) {
        lastError = error
      }
    }
    
    // **METHOD 3: Google Meet Specific Button Structure** (Based on actual HTML)
    if (!clickSuccess) {
      try {
        // Look for the exact Google Meet send button structure with icon
        const meetSendButton = await safePageEvaluate<{hasButton: boolean, isEnabled?: boolean} | null>(page, () => {
          const buttons = Array.from(document.querySelectorAll('button[jsname="SoqoBf"]'))
          
          for (const button of buttons) {
            // Check if it has the send icon
            const sendIcon = button.querySelector('i.google-symbols')
            if (sendIcon && sendIcon.textContent?.includes('send')) {
              return {
                hasButton: true,
                isEnabled: !(button as HTMLButtonElement).disabled
              }
            }
          }
          
          return { hasButton: false }
        })
        
        if (meetSendButton && meetSendButton.hasButton && meetSendButton.isEnabled) {
          try {
            // Try clicking the Google Meet specific button
            await safePageEvaluate(page, () => {
              const buttons = Array.from(document.querySelectorAll('button[jsname="SoqoBf"]'))
              for (const button of buttons) {
                const sendIcon = button.querySelector('i.google-symbols')
                if (sendIcon && sendIcon.textContent?.includes('send')) {
                  (button as HTMLElement).click()
                  return true
                }
              }
              return false
            })
            clickSuccess = true
          } catch (gmeetError) {
            lastError = gmeetError
          }
        }
        
        // Fallback to simple page.click if specific method didn't work
        if (!clickSuccess) {
          for (const selector of sendButtonSelectors) {
            try {
              const element = await page.$(selector)
              if (element) {
                await page.click(selector)
                clickSuccess = true
                break
              }
            } catch (pageClickError) {
              continue
            }
          }
        }
        
      } catch (error) {
        lastError = error
      }
    }
    
    // **METHOD 4: Keyboard Enter as last resort**
    if (!clickSuccess) {
      try {
        await page.keyboard.press('Enter')
        clickSuccess = true
      } catch (keyError) {
        lastError = keyError
      }
    }
    
    if (clickSuccess) {
      console.log(`🎯 Verifying message was actually sent...`)
      
      // **CRITICAL VERIFICATION**: Check if message was actually sent
      let messageActuallySent = false
      
      // Wait a moment for the UI to process the send
      await delay(1000)
      
      // Method 1: Check if textarea is now empty (message should be cleared after sending)
      try {
        const currentTextarea = await getChatTextarea(page)
        if (currentTextarea) {
          const textareaValue = await currentTextarea.evaluate((el: HTMLTextAreaElement) => el.value)
          
          if (textareaValue === '' || textareaValue !== message) {
            messageActuallySent = true
          }
        }
      } catch (e) {
        // Continue to next verification method
      }
      
      // Method 2: Look for the message in the chat history
      if (!messageActuallySent) {
        try {
          const messageInChat = await safePageEvaluate<boolean>(page, (msgText: string) => {
            // Look for the message in chat message containers
            const chatMessages = document.querySelectorAll('[data-message-text], .chat-message, [class*="message"], [class*="chat"]')
            
            for (const msgElement of Array.from(chatMessages)) {
              if (msgElement.textContent?.includes(msgText)) {
                return true
              }
            }
            
            // Also check for any text nodes containing our message
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT
            )
            
            let node
            while (node = walker.nextNode()) {
              if (node.textContent?.includes(msgText)) {
                const parentElement = node.parentElement
                if (parentElement && parentElement.closest('[class*="chat"], [class*="message"]')) {
                  return true
                }
              }
            }
            
            return false
          }, message)
          
          if (messageInChat === true) {
            messageActuallySent = true
          }
        } catch (e) {
          // Continue to emergency fallback
        }
      }
      
      if (messageActuallySent) {
        console.log(`📤 Message successfully sent: "${message}"`)
      } else {
        console.log(`⚠️ Message verification failed, attempting emergency send...`)
        
        // Try one more time with Enter key as emergency fallback
        try {
          const currentTextarea = await getChatTextarea(page)
          if (currentTextarea) {
            await currentTextarea.focus()
            await delay(200)
            await page.keyboard.press('Enter')
            await delay(1000)
            
            // Check again if textarea is cleared
            const finalTextareaValue = await currentTextarea.evaluate((el: HTMLTextAreaElement) => el.value)
            if (finalTextareaValue === '' || finalTextareaValue !== message) {
              messageActuallySent = true
            }
          }
        } catch (emergencyError) {
          // Emergency send failed
        }
      }
      

      
      // Only consider it successful if verification passed
      if (!messageActuallySent) {
        throw new Error(`Send button clicked but message verification failed - message may not have been sent`)
      }
      
    } else {
      console.error(`❌ All send button click methods failed. Last error:`, lastError instanceof Error ? lastError.message : lastError)
      throw new Error(`Failed to click send button after trying all methods: ${lastError instanceof Error ? lastError.message : lastError}`)
    }
  } catch (err) {
    console.error(
      '❌ Error sending chat message:',
      err instanceof Error ? err.message : err,
    )

    // Re-throw the error so the caller can handle it (for screenshot capture)
    throw err
  }
}
