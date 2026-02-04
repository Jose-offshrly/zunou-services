import fs from 'node:fs'
import path from 'node:path'

import AWS from 'aws-sdk'

import { runCleanup } from './cleanup.ts'
import { completeMeeting } from './dynamo.ts'
import { env } from './env.ts'
import state from './state.ts'
import { sendToWhisper, processFullAccumulatedAudio } from './whisper.ts'
import { triggerEmergencyShutdown, detectMeetingPlatform } from './utils.ts'
import { assemblyAIPostProcessor } from './assemblyai-post-processor.ts'
import { assemblyAIRealtime } from './assemblyai-realtime.ts'

// ✅ **Global types for S3 safety net**
declare global {
  var markS3UploadCompleted: (() => void) | undefined
}

// Initialize AWS S3
const s3 = new AWS.S3({
  endpoint: env.S3_ENDPOINT,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION,
  s3ForcePathStyle: env.S3_FORCE_PATH_STYLE,
})

// Helper delay function
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

// ✅ **Stop Audio Processing**
export function stopAudioProcessing() {
  if (state.audioProcessingInterval) {
    console.log('🔄 Stopping audioProcessingInterval:')
    clearInterval(state.audioProcessingInterval)
    state.audioProcessingInterval = null
    console.log('⏹️ Audio processing interval stopped.')
  } else {
    console.log('⚠️ No active audio processing interval found.')
  }
  
  // ✅ **Stop Modal Suppression**
  if (state.modalSuppressionInterval) {
    console.log('🔄 Stopping modalSuppressionInterval:')
    clearInterval(state.modalSuppressionInterval)
    state.modalSuppressionInterval = null
    console.log('⏹️ Modal suppression interval stopped.')
  }
}

// ✅ **S3 Safety Net**: Catch any TargetCloseError and ensure S3 upload happens
function setupS3SafetyNet() {
  console.log('🛡️ [S3 SAFETY NET] Installing CDP error protection...')
  
  // Track if S3 upload has already completed successfully
  let s3UploadCompleted = false
  
  // ✅ **GLOBAL PROTECTION**: Track S3 upload status globally to prevent duplicates
  global.markS3UploadCompleted = () => {
    s3UploadCompleted = true
    console.log('✅ [S3 SAFETY NET] S3 upload marked as completed globally')
  }
  
  // Override the existing S3 upload success to track completion
  const originalUploadToS3 = uploadToS3
  const uploadAttempts = new Set<string>()
  
  // Install process-level error handlers
  process.on('uncaughtException', async (error: Error) => {
    if (error.message.includes('TargetCloseError') || error.message.includes('Protocol error') || error.message.includes('Target closed')) {
      console.log('🚨 [S3 SAFETY NET] CDP error detected - ensuring S3 upload happens')
      
      if (!s3UploadCompleted) {
        console.log('📤 [S3 SAFETY NET] S3 upload not yet completed - performing now')
        try {
          await performS3Upload()
          s3UploadCompleted = true
          console.log('✅ [S3 SAFETY NET] S3 upload completed successfully despite CDP error')
        } catch (s3Error) {
          console.error('❌ [S3 SAFETY NET] S3 upload failed:', s3Error)
          
          // ✅ Mark transcription as failed due to S3 upload error in safety net
          if (state.meetingId) {
            const { markTranscriptionFailure } = await import('./dynamo.ts')
            await markTranscriptionFailure(state.meetingId)
          }
        }
      } else {
        console.log('✅ [S3 SAFETY NET] S3 upload already completed - no action needed')
      }
      
      console.log('💀 [S3 SAFETY NET] Exiting gracefully after S3 protection')
      process.exit(0) // Exit cleanly since S3 upload is protected
    } else {
      // Re-throw other errors normally
      throw error
    }
  })
  
  process.on('unhandledRejection', async (reason: any) => {
    const errorMessage = reason?.message || String(reason)
    if (errorMessage.includes('TargetCloseError') || errorMessage.includes('Protocol error') || errorMessage.includes('Target closed')) {
      console.log('🚨 [S3 SAFETY NET] CDP rejection detected - ensuring S3 upload happens')
      
      if (!s3UploadCompleted) {
        try {
          await performS3Upload()
          s3UploadCompleted = true
          console.log('✅ [S3 SAFETY NET] S3 upload completed successfully despite CDP rejection')
        } catch (s3Error) {
          console.error('❌ [S3 SAFETY NET] S3 upload failed:', s3Error)
          
          // ✅ Mark transcription as failed due to S3 upload error in safety net
          if (state.meetingId) {
            const { markTranscriptionFailure } = await import('./dynamo.ts')
            await markTranscriptionFailure(state.meetingId)
          }
        }
      }
      
      console.log('💀 [S3 SAFETY NET] Exiting gracefully after S3 protection')
      process.exit(0)
    } else {
      // Re-throw other rejections
      throw reason
    }
  })
  
  // Mark S3 upload as completed when it actually finishes
  global.markS3UploadCompleted = () => {
    s3UploadCompleted = true
    console.log('✅ [S3 SAFETY NET] S3 upload marked as completed')
  }
  
  console.log('🛡️ [S3 SAFETY NET] Protection active - will catch any CDP errors')
}

// ✅ **Error-tolerant S3 upload function with retry logic**
async function performS3Upload() {
  console.log('📤 [S3] Starting PRIORITY S3 upload process...')
  
  try {
    const currentMeetingId = state.meetingId
    if (!currentMeetingId) {
      console.warn('⚠️ [S3] No meeting ID available - skipping S3 upload')
      return
    }

    console.log(`📤 [S3] Uploading files for meeting: ${currentMeetingId}`)

    // ✅ **PRIORITY**: Upload transcription log FIRST (most important)
    console.log('📝 [S3] Uploading transcription files (PRIORITY)...')
    
    // Collect all transcription file variants
    const transcriptionFiles = [
      { path: state.transcriptionLogPath, name: 'cleaned transcription' }
    ]
    
    // Add other transcription variants if they exist
    if (state.transcriptionLogPath) {
      const basePath = state.transcriptionLogPath.replace('_transcriptions.log', '')
      const additionalFiles = [
        { path: `${basePath}_transcriptions_with_speaker_labels.log`, name: 'transcription with speaker labels' },
        { path: `${basePath}_transcriptions_speaker_labels_only.log`, name: 'transcription speaker labels only' },
        { path: `${basePath}_transcriptions_speaker_report.txt`, name: 'speaker report' }
      ]
      
      for (const file of additionalFiles) {
        if (fs.existsSync(file.path)) {
          transcriptionFiles.push(file)
        }
      }
    }
    
    let transcriptionUploadSuccess = false
    
    for (const file of transcriptionFiles) {
      if (file.path && fs.existsSync(file.path)) {
        const logKey = `meetings/${currentMeetingId}/transcriptions/${path.basename(file.path)}`
        console.log(`📤 [S3] Uploading ${file.name} to S3: ${logKey}`)
        
        // ✅ **RETRY LOGIC**: Try upload with retries to handle race conditions
        let uploadAttempts = 0
        const maxRetries = 3
        let uploadSuccess = false
        
        while (uploadAttempts < maxRetries && !uploadSuccess) {
          try {
            uploadAttempts++
            console.log(`📤 [S3] Upload attempt ${uploadAttempts}/${maxRetries} for ${file.name}`)
            await uploadToS3(file.path, logKey)
            console.log(`✅ [S3] Successfully uploaded ${file.name}`)
            transcriptionUploadSuccess = true
            uploadSuccess = true
          } catch (fileError) {
            console.error(`❌ [S3] Upload attempt ${uploadAttempts} failed for ${file.name}:`, fileError)
            if (uploadAttempts < maxRetries) {
              console.log(`🔄 [S3] Retrying upload for ${file.name} in 1 second...`)
              await delay(1000)
            } else {
              console.error(`❌ [S3] All upload attempts failed for ${file.name}`)
            }
          }
        }
      } else {
        console.warn(`⚠️ [S3] ${file.name} file not found or doesn't exist: ${file.path}`)
      }
    }

    // ✅ Upload video recording (secondary priority)
    if (
      state.currentRecordingPath &&
      fs.existsSync(state.currentRecordingPath)
    ) {
      const videoKey = `meetings/${currentMeetingId}/video/${path.basename(state.currentRecordingPath)}`
      console.log(`📤 [S3] Uploading recording to S3: ${videoKey}`)
      
      // ✅ **RETRY LOGIC**: Try video upload with retries
      let videoUploadAttempts = 0
      const maxVideoRetries = 3
      let videoUploadSuccess = false
      
      while (videoUploadAttempts < maxVideoRetries && !videoUploadSuccess) {
        try {
          videoUploadAttempts++
          console.log(`📤 [S3] Video upload attempt ${videoUploadAttempts}/${maxVideoRetries}`)
          await uploadToS3(state.currentRecordingPath, videoKey)
          console.log('✅ [S3] Successfully uploaded video recording')
          videoUploadSuccess = true
        } catch (videoError) {
          console.error(`❌ [S3] Video upload attempt ${videoUploadAttempts} failed:`, videoError)
          if (videoUploadAttempts < maxVideoRetries) {
            console.log(`🔄 [S3] Retrying video upload in 1 second...`)
            await delay(1000)
          } else {
            console.error('❌ [S3] All video upload attempts failed')
          }
        }
      }
    } else {
      console.warn('⚠️ [S3] No video recording file found')
    }

    console.log(`✅ [S3] S3 upload process completed for meeting ${currentMeetingId}`)
    
    // ✅ Mark transcription as successfully generated only if transcription file was uploaded
    if (transcriptionUploadSuccess && currentMeetingId) {
      try {
        const { markTranscriptionSuccess } = await import('./dynamo.ts')
        await markTranscriptionSuccess(currentMeetingId)
        console.log(`✅ [S3] Transcription marked as successfully generated in DynamoDB after successful S3 upload`)
      } catch (dyndbError) {
        console.error('❌ [S3] Error marking transcription success after S3 upload:', dyndbError)
      }
    } else {
      console.warn('⚠️ [S3] Transcription file was not uploaded successfully - not marking as generated')
    }
    
    // ✅ Mark S3 upload as completed for safety net
    if (global.markS3UploadCompleted) {
      global.markS3UploadCompleted()
    }
  } catch (error) {
    console.error('❌ [S3] Error during S3 upload process:', error)
    throw error
  }
}

// ✅ **Stop Meet Bot Function**
export async function stopMeetBot() {
  console.log('🛑 Stop Meet Bot called.🛑 ')

  if (state.isClosing) {
    console.log('⚠️ Bot is already stopping. Ignoring duplicate call.')
    return
  }

  state.isClosing = true // **Set flag to prevent duplicate stops**
  
  // ✅ **CRITICAL**: Immediately trigger emergency shutdown to prevent any page operations
  try {
    // Immediately disable all operations
    state.isBotRunning = false
    console.log('🛑 Bot operations disabled immediately')
    
    // ✅ **ULTRA-CRITICAL**: Trigger emergency shutdown immediately
    // This will immediately override page.evaluate and other operations
    triggerEmergencyShutdown('stopMeetBot called')
    console.log('🚨 Emergency shutdown triggered globally')
  } catch (error) {
    console.warn('⚠️ Error during immediate shutdown:', error)
  }

  // ✅ **PLATFORM-SPECIFIC PROTECTION**: Only apply S3 safety net for Zoom/Teams
  let platform = 'unknown'
  
  // ✅ **BEST APPROACH**: Use stored platform from meeting start
  if (state.meetingPlatform && state.meetingPlatform !== 'unknown') {
    platform = state.meetingPlatform
    console.log(`🎯 [STORED] Using stored platform from meeting start: ${platform}`)
  } else {
    // ✅ **FALLBACK**: Try to detect from browser URL if stored platform not available
    try {
      if (state.activeBrowser && state.activeBrowser.isConnected()) {
        const pages = await state.activeBrowser.pages()
        if (pages.length > 0 && !pages[0].isClosed()) {
          const currentUrl = pages[0].url()
          platform = detectMeetingPlatform(currentUrl)
          console.log(`🔍 [URL] Detected platform from browser URL: ${platform}`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not detect platform from browser during shutdown:', error)
    }
    
    // ✅ **LAST RESORT**: Enhanced fallback using meeting ID patterns
    if (platform === 'unknown' && state.meetingId) {
      const meetingId = state.meetingId.toLowerCase()
      
      if (meetingId.includes('-')) {
        // Google Meet IDs typically have format like 'add-ebkh-tzi'
        platform = 'google-meet'
        console.log('🎵 [FALLBACK] Detected Google Meet based on meeting ID pattern')
      } else if (meetingId.length >= 9 && /^\d+$/.test(meetingId)) {
        // Zoom meeting IDs are typically 9-11 digits
        platform = 'zoom'
        console.log('🎯 [FALLBACK] Detected Zoom based on numeric meeting ID pattern')
      } else if (meetingId.length > 15 && /^[a-z0-9]+$/.test(meetingId)) {
        // Long alphanumeric IDs could be Teams
        platform = 'teams'
        console.log('🎯 [FALLBACK] Detected Teams based on long alphanumeric meeting ID pattern')
      } else {
        console.log(`⚠️ [FALLBACK] Could not determine platform from meeting ID: ${state.meetingId}`)
      }
    }
  }
  
  if (platform === 'zoom' || platform === 'teams') {
    console.log(`🛡️ [${platform.toUpperCase()}] Installing S3 safety net for CDP protection...`)
    setupS3SafetyNet()
    console.log('🧹 Starting normal cleanup operations (with S3 safety net active)...')
  } else {
    console.log(`🎵 [${platform.toUpperCase()}] Using minimal cleanup to preserve audio quality...`)
    console.log('🧹 Starting normal cleanup operations (minimal for audio preservation)...')
  }
  
  // ✅ **Stop all monitoring immediately** by setting isBotRunning to false early
  console.log('🛑 Stopping all monitoring functions...')
  state.isBotRunning = false
  
  // ✅ **CRITICAL FIX**: Reset meetingId immediately to prevent false "already running" errors
  const currentMeetingId = state.meetingId
  state.meetingId = null
  console.log(`🔄 Reset meetingId (was: ${currentMeetingId}) to prevent race conditions`)

  try {
    if (state.stopTimeout) {
      clearTimeout(state.stopTimeout)
      state.stopTimeout = null
    }

    console.log('⏹️ Calling stopAudioProcessing...')
    stopAudioProcessing()

    // ✅ Process accumulated audio if in full accumulation mode
    if (state.isFullAccumulationMode && state.fullAudioAccumulator.length > 0) {
      console.log('🧪 Processing full accumulated audio before exit...')
      await processFullAccumulatedAudio()
    } else if (state.audioBuffer.length > 0) {
      // ✅ Ensure the last audio chunk is sent to Whisper **before finalizing** (standard mode)
      console.log('🚀 Sending final audio chunk to Whisper before exit...')
      // Pass 16000 Hz as default for final processing
      await sendToWhisper(state.audioBuffer, 0, false, 16000, state.currentSpeaker)
      state.audioBuffer = Buffer.alloc(0)
    }

    // ✅ Mark as finalizing **after sending the last chunk**
    state.isFinalizing = true

    // ✅ Wait for all pending Whisper transcriptions to complete
    console.log(
      `⏳ Waiting for pending transcriptions (${state.pendingTranscriptions})...`,
    )
    while (state.pendingTranscriptions > 0) {
      await delay(1000)
    }
    console.log('✅ All Whisper transcriptions completed.')

    // 🧹 Clean up transcription hallucinations and repetitions (non-blocking)
    // ✅ **STOP ASSEMBLY.AI REAL-TIME TRANSCRIPTION**
    console.log('🛑 Stopping Assembly.ai real-time transcription...')
    await assemblyAIRealtime.stop()
    
    // Get visual detection statistics to decide if we need batch fallback
    const realtimeStats = assemblyAIRealtime.getVisualDetectionStats()
    
    console.log(`\n=== REAL-TIME TRANSCRIPTION SUMMARY ===`)
    console.log(`Total transcripts: ${realtimeStats.totalTranscripts}`)
    console.log(`Visual detection rate: ${realtimeStats.visualDetectionRate.toFixed(1)}%`)
    console.log(`Status: ${realtimeStats.isVisualDetectionWorking ? '✅ Good' : '⚠️ Poor'}`)
    console.log(`Batch fallback needed: ${realtimeStats.needsBatchFallback ? 'YES' : 'NO'}`)
    console.log(`========================================\n`)
    
    // ✅ **ZOOM FIX**: Skip transcript cleanup for Zoom (it messes up the transcription)
    // Zoom's audio quality and Assembly.ai real-time transcription work well together
    // The cleanup was removing valid content or introducing artifacts
    const shouldCleanupTranscript = platform !== 'zoom'
    
    if (shouldCleanupTranscript) {
      // Hybrid transcript cleanup: rule-based (fast) + AI refinement (background)
      if (state.transcriptionLog.length > 0 && state.transcriptionLogPath && fs.existsSync(state.transcriptionLogPath)) {
        console.log('\nStarting transcript cleanup...')
        
        try {
          // Phase 1: Rule-based cleanup (synchronous)
          console.log('Running rule-based cleanup...')
          const { transcriptCleaner } = await import('./transcript-cleaner.ts')
          await transcriptCleaner.cleanTranscript(state.transcriptionLogPath, state.transcriptionLogPath)
          console.log('Rule-based cleanup completed')
          
          // Phase 2: AI refinement (asynchronous, background)
          console.log('Starting AI refinement in background...')
          const { aiTranscriptCleaner } = await import('./ai-transcript-cleaner.ts')
          
          // Run in background without blocking shutdown
          aiTranscriptCleaner.cleanTranscript(
            state.transcriptionLogPath,
            state.transcriptionLogPath,
            { 
              mode: 'balanced',
              preserveTimestamps: true,
              improveGrammar: false
            }
          ).then(() => {
            console.log('AI refinement completed')
          }).catch(error => {
            console.error('AI refinement failed:', error.message || error)
            console.log('Rule-based cleaned version will be used')
          })
          
          console.log('AI refinement running in background, continuing shutdown...')
          
        } catch (cleanError) {
          console.error('Transcript cleanup failed:', cleanError instanceof Error ? cleanError.message : cleanError)
          console.log('Original transcription remains unchanged')
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } else {
      console.log(`\n✅ [${platform.toUpperCase()}] Skipping transcript cleanup - using raw transcription`)
    }

    // Brain dump: one person talking to the bot, use simple batch processing
    const isBrainDump = state.meetingType === 'brain-dump'
    
    if (isBrainDump) {
      // Just run batch - brain dumps have one speaker so no need for hybrid merging
      console.log('\n🧠 Brain dump - using batch-only processing')
      console.log('Single speaker meeting, no hybrid processing needed\n')
      
      if (state.currentRecordingPath && state.transcriptionLogPath && fs.existsSync(state.currentRecordingPath)) {
        console.log('Starting batch processing...')
        try {
          // Keep the real-time transcript as backup if it exists
          const realtimePath = state.transcriptionLogPath.replace('.log', '_realtime.log')
          if (fs.existsSync(state.transcriptionLogPath)) {
            fs.copyFileSync(state.transcriptionLogPath, realtimePath)
            console.log(`Real-time transcript backed up: ${realtimePath}`)
          }
          
          // Brain dump = 1 speaker (just the person talking to the bot)
          const expectedSpeakers = 1
          
          const meetingStartTime = state.meetingStartTime || Date.now()
          console.log(`Meeting started: ${new Date(meetingStartTime).toISOString()}`)
          console.log(`Expected speakers: ${expectedSpeakers}`)
          console.log(`Speaker changes logged: ${state.speakerChangeLog.length}`)
          
          // Just run batch, this will be our final transcript
          console.log('\nRunning batch processing...')
          await assemblyAIPostProcessor.processRecording(
            state.currentRecordingPath,
            state.transcriptionLogPath,
            state.participantRoster,
            expectedSpeakers,
            meetingStartTime,
            state.speakerChangeLog
          )
          console.log('Batch processing completed')
          
          console.log('\n🧠 Batch processing complete')
          console.log(`Files:`)
          console.log(`  Main: ${path.basename(state.transcriptionLogPath)}`)
          if (fs.existsSync(realtimePath)) {
            console.log(`  Real-time backup: ${path.basename(realtimePath)}`)
          }
          
        } catch (batchError) {
          console.error('Batch processing failed:', 
            batchError instanceof Error ? batchError.message : batchError)
          console.log('Falling back to real-time transcript')
          
          // Restore real-time if batch failed
          const realtimePath = state.transcriptionLogPath.replace('.log', '_realtime.log')
          if (fs.existsSync(realtimePath)) {
            fs.copyFileSync(realtimePath, state.transcriptionLogPath)
            console.log('Real-time transcript restored')
          }
        }
      } else {
        console.log('Skipping batch processing - recording or transcript not found')
        if (!state.currentRecordingPath) {
          console.log('  No recording path')
        } else if (!fs.existsSync(state.currentRecordingPath)) {
          console.log(`  Recording file missing: ${state.currentRecordingPath}`)
        }
        if (!state.transcriptionLogPath) {
          console.log('  No transcript path')
        }
      }
    } else {
      // Regular meeting: Conditional batch processing - only run if visual detection was poor
      const shouldRunBatchFallback = realtimeStats.needsBatchFallback
      
      if (shouldRunBatchFallback) {
        console.log(`\nVisual detection rate was low (${realtimeStats.visualDetectionRate.toFixed(1)}%)`)
        console.log(`Running batch processing as fallback to improve speaker attribution...\n`)
      } else {
        console.log(`\nVisual detection worked well (${realtimeStats.visualDetectionRate.toFixed(1)}%)`)
        console.log(`Skipping batch processing - using real-time transcripts as-is\n`)
      }
      
      if (shouldRunBatchFallback && state.currentRecordingPath && state.transcriptionLogPath && fs.existsSync(state.currentRecordingPath)) {
        console.log('Starting batch processing (fallback mode)...')
        try {
          // Backup real-time transcript before batch overwrites it
          const realtimePath = state.transcriptionLogPath.replace('.log', '_realtime.log')
          if (fs.existsSync(state.transcriptionLogPath)) {
            fs.renameSync(state.transcriptionLogPath, realtimePath)
            console.log(`Real-time transcript backed up: ${realtimePath}`)
          }
          
          const expectedSpeakers = state.participantRoster.size > 0 
            ? state.participantRoster.size 
            : undefined
          
          const meetingStartTime = state.meetingStartTime || Date.now()
          console.log(`Meeting started at: ${new Date(meetingStartTime).toISOString()}`)
          console.log(`Speaker change log entries: ${state.speakerChangeLog.length}`)
          
          if (state.speakerChangeLog.length > 0) {
            console.log(`First 5 speaker changes:`)
            state.speakerChangeLog.slice(0, 5).forEach((change, idx) => {
              console.log(`  ${idx + 1}. ${change.isoTimestamp}: ${change.speaker}`)
            })
          } else {
            console.warn(`WARNING: Speaker change log is EMPTY! Timestamp correlation will not work.`)
          }
            
          await assemblyAIPostProcessor.processRecording(
            state.currentRecordingPath,
            state.transcriptionLogPath,
            state.participantRoster,
            expectedSpeakers,
            meetingStartTime,
            state.speakerChangeLog
          )
          console.log('Assembly.ai batch processing completed successfully')
          console.log('Batch-corrected transcripts will be used as final version')
        } catch (postProcessError) {
          console.error('Error in batch processing:', 
            postProcessError instanceof Error ? postProcessError.message : postProcessError)
          console.log('Falling back to real-time transcription')
          
          // Restore real-time transcript if batch failed
          const realtimePath = state.transcriptionLogPath.replace('.log', '_realtime.log')
          if (fs.existsSync(realtimePath) && !fs.existsSync(state.transcriptionLogPath)) {
            fs.renameSync(realtimePath, state.transcriptionLogPath)
            console.log('Real-time transcript restored as primary')
          }
        }
      } else if (!shouldRunBatchFallback) {
        console.log('Using real-time transcripts as final version (visual detection was good)')
      } else {
        console.log('Skipping batch processing: recording or transcript not found')
      }
    }

    // Clear active speaker
    state.currentSpeaker = 'User'

    // ✅ Stop media stream (Prevents further recording)
    if (state.activeStream) {
      console.log('⏹️ Stopping media stream...')
      try {
        state.activeStream.destroy()
      } catch (streamError) {
        console.warn('⚠️ Error destroying stream (context may be destroyed):', 
          streamError instanceof Error ? streamError.message : streamError)
      }
      state.activeStream = null
    }

    // ✅ Stop audio simulation if active
    if (state.audioSimulationCleanup) {
      console.log('⏹️ Stopping audio simulation...')
      state.audioSimulationCleanup()
      state.audioSimulationCleanup = null
    }

    // ✅ Stop FFmpeg process
    if (state.activeProcess && typeof state.activeProcess.kill === 'function') {
      console.log('⏹️ Stopping FFmpeg process...')
      state.activeProcess.kill('SIGTERM')
      state.activeProcess = null
    }

    // ✅ **PLATFORM-SPECIFIC S3 UPLOAD**: Only upload early for Zoom/Teams (Google Meet uses normal timing)
    if (platform === 'zoom' || platform === 'teams') {
      console.log(`📤 [${platform.toUpperCase()}] Starting S3 upload BEFORE browser close (CDP protection)...`)
      try {
        // ✅ Upload final video
        if (
          state.currentRecordingPath &&
          fs.existsSync(state.currentRecordingPath)
        ) {
          const videoKey = `meetings/${currentMeetingId}/video/${path.basename(state.currentRecordingPath)}`
          console.log(`📤 Uploading recording to S3: ${videoKey}`)
          await uploadToS3(state.currentRecordingPath, videoKey)
          console.log('✅ Video recording uploaded successfully')
        } else {
          console.log('⚠️ No video recording file found for upload')
        }

        // ✅ Upload transcription log
        const transcriptionFiles = [
          { path: state.transcriptionLogPath, name: 'cleaned transcription' }
        ]
        
        // Add other transcription variants if they exist
        if (state.transcriptionLogPath) {
          const basePath = state.transcriptionLogPath.replace('_transcriptions.log', '')
          const additionalFiles = [
            { path: `${basePath}_transcriptions_with_speaker_labels.log`, name: 'transcription with speaker labels' },
            { path: `${basePath}_transcriptions_speaker_labels_only.log`, name: 'transcription speaker labels only' },
            { path: `${basePath}_transcriptions_speaker_report.txt`, name: 'speaker report' }
          ]
          
          for (const file of additionalFiles) {
            if (fs.existsSync(file.path)) {
              transcriptionFiles.push(file)
            }
          }
        }
        
        let transcriptionUploadSuccess = false
        
        for (const file of transcriptionFiles) {
          if (file.path && fs.existsSync(file.path)) {
            const logKey = `meetings/${currentMeetingId}/transcriptions/${path.basename(file.path)}`
            console.log(`📤 Uploading ${file.name} to S3: ${logKey}`)
            await uploadToS3(file.path, logKey)
            console.log(`✅ ${file.name} uploaded successfully`)
            transcriptionUploadSuccess = true
          } else {
            console.log(`⚠️ ${file.name} file not found: ${file.path}`)
          }
        }

        console.log(
          `✅ [${platform.toUpperCase()}] Successfully uploaded session files for meeting ${currentMeetingId}`,
        )
        
        // ✅ Mark transcription as successfully generated only if transcription file was uploaded
        if (transcriptionUploadSuccess && currentMeetingId) {
          try {
            const { markTranscriptionSuccess } = await import('./dynamo.ts')
            await markTranscriptionSuccess(currentMeetingId)
            console.log(`✅ [${platform.toUpperCase()}] Transcription marked as successfully generated in DynamoDB after successful S3 upload`)
          } catch (dyndbError) {
            console.error(`❌ [${platform.toUpperCase()}] Error marking transcription success after S3 upload:`, dyndbError)
          }
        } else {
          console.warn(`⚠️ [${platform.toUpperCase()}] Transcription file was not uploaded successfully - not marking as generated`)
        }
        
        // ✅ Mark S3 upload as completed for safety net
        if (global.markS3UploadCompleted) {
          global.markS3UploadCompleted()
        }
      } catch (uploadErr) {
        console.error(`❌ [${platform.toUpperCase()}] Error uploading session files to S3:`, uploadErr)
        
        // ✅ Mark transcription as failed due to S3 upload error
        if (currentMeetingId) {
          const { markTranscriptionFailure } = await import('./dynamo.ts')
          await markTranscriptionFailure(currentMeetingId)
        }
      }
    } else {
      console.log(`🎵 [${platform.toUpperCase()}] Preserving normal S3 upload timing for audio quality`)
    }

    // ✅ Ensure all Puppeteer operations are finished before closing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // ✅ Close the browser
    try {
      if (state.activeBrowser) {
        console.log('⏹️ Closing browser...')
        
        // Add extra safety: check if browser is still connected before closing
        if (state.activeBrowser.isConnected()) {
          await state.activeBrowser.close()
        } else {
          console.log('⚠️ Browser already disconnected, skipping close operation')
        }
        state.activeBrowser = null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (
        errorMessage.includes('Execution context was destroyed') ||
        errorMessage.includes('Protocol error') ||
        errorMessage.includes('Session closed') ||
        errorMessage.includes('Target closed')
      ) {
        console.warn('⚠️ Browser context already destroyed during cleanup - this is expected during meeting end')
      } else {
        console.warn('⚠️ Browser was already closed or failed to close:', errorMessage)
      }
      // Ensure we clean up the reference regardless
      state.activeBrowser = null
    }

    // ✅ **GOOGLE MEET & UNKNOWN S3 UPLOAD**: Normal timing for Google Meet and fallback (after browser close)
    if (platform === 'google-meet' || platform === 'unknown') {
      const displayPlatform = platform === 'unknown' ? 'FALLBACK' : 'GOOGLE MEET'
      console.log(`📤 [${displayPlatform}] Starting S3 upload at normal timing (preserving audio quality)...`)
      try {
        // ✅ Upload final video
        if (
          state.currentRecordingPath &&
          fs.existsSync(state.currentRecordingPath)
        ) {
          const videoKey = `meetings/${currentMeetingId}/video/${path.basename(state.currentRecordingPath)}`
          console.log(`📤 Uploading recording to S3: ${videoKey}`)
          await uploadToS3(state.currentRecordingPath, videoKey)
          console.log('✅ Video recording uploaded successfully')
        } else {
          console.log('⚠️ No video recording file found for upload')
        }

        // ✅ Upload transcription log
        const transcriptionFiles = [
          { path: state.transcriptionLogPath, name: 'cleaned transcription' }
        ]
        
        // Add other transcription variants if they exist
        if (state.transcriptionLogPath) {
          const basePath = state.transcriptionLogPath.replace('_transcriptions.log', '')
          const additionalFiles = [
            { path: `${basePath}_transcriptions_with_speaker_labels.log`, name: 'transcription with speaker labels' },
            { path: `${basePath}_transcriptions_speaker_labels_only.log`, name: 'transcription speaker labels only' },
            { path: `${basePath}_transcriptions_speaker_report.txt`, name: 'speaker report' }
          ]
          
          for (const file of additionalFiles) {
            if (fs.existsSync(file.path)) {
              transcriptionFiles.push(file)
            }
          }
        }
        
        let transcriptionUploadSuccess = false
        
        for (const file of transcriptionFiles) {
          if (file.path && fs.existsSync(file.path)) {
            const logKey = `meetings/${currentMeetingId}/transcriptions/${path.basename(file.path)}`
            console.log(`📤 Uploading ${file.name} to S3: ${logKey}`)
            await uploadToS3(file.path, logKey)
            console.log(`✅ ${file.name} uploaded successfully`)
            transcriptionUploadSuccess = true
          } else {
            console.log(`⚠️ ${file.name} file not found: ${file.path}`)
          }
        }

        console.log(
          `✅ [${displayPlatform}] Successfully uploaded session files for meeting ${currentMeetingId}`,
        )
        
        // ✅ Mark transcription as successfully generated only if transcription file was uploaded
        if (transcriptionUploadSuccess && currentMeetingId) {
          try {
            const { markTranscriptionSuccess } = await import('./dynamo.ts')
            await markTranscriptionSuccess(currentMeetingId)
            console.log(`✅ [${displayPlatform}] Transcription marked as successfully generated in DynamoDB after successful S3 upload`)
          } catch (dyndbError) {
            console.error(`❌ [${displayPlatform}] Error marking transcription success after S3 upload:`, dyndbError)
          }
        } else {
          console.warn(`⚠️ [${displayPlatform}] Transcription file was not uploaded successfully - not marking as generated`)
        }
      } catch (uploadErr) {
        console.error(`❌ [${displayPlatform}] Error uploading session files to S3:`, uploadErr)
      }
    } else {
      console.log(`✅ [${platform.toUpperCase()}] S3 upload already completed before browser close`)
    }

    // ✅ Clean up local file store
    if (state.sessionDir) {
      fs.rmSync(state.sessionDir, { recursive: true, force: true })
    }

    // ✅ Reset transcription log for next session
    state.transcriptionLog = []
    state.speakerChangeLog = []
    state.audioChunkTimeline = []

    // ✅ Mark meeting as complete in DynamoDB (only if not already marked with specific status)
    if (currentMeetingId) {
      // Check if meeting already has a specific end status (like not_admitted)
      const { isMeetingCompleted } = await import('./dynamo.ts')
      const isAlreadyCompleted = await isMeetingCompleted(currentMeetingId)
      
      // Only mark as completed if not already marked with an end status
      if (!isAlreadyCompleted) {
        await completeMeeting(currentMeetingId)
      }
    }

    // ✅ Resolve the promise so `startMeetBot()` can finish
    if (currentMeetingId) {
      state.activeRecordings[currentMeetingId]?.() // Resolves the `await startMeetBot()` in `pollSQS()`
      state.activeRecordings[currentMeetingId] = null // Cleanup

      await runCleanup(currentMeetingId)
    }
    console.log(`✅ MeetBot successfully stopped for ${currentMeetingId}.`)
  } catch (err) {
    console.error(
      '❌ Error while stopping Meet Bot:',
      err instanceof Error ? err.message : err,
    )
  } finally {
    state.transcriptionLog = [] // clear transcription log when finished
    state.speakerChangeLog = [] // clear speaker change log for next meeting
    state.audioChunkTimeline = [] // clear audio chunk timeline for next meeting
    state.isBotRunning = false // Reset flags after finished
    state.isFinalizing = false
    state.isBotPaused = false
    state.isClosing = false
    state.meetingId = null
    state.hasJoined = false
    state.joinedAt = null // Reset joined timestamp
    if (state.heartbeatInterval) {
      clearInterval(state.heartbeatInterval)
      state.heartbeatInterval = null
    }
  }
}

// New helper to upload a file to S3
async function uploadToS3(filePath: string, key: string) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath)
    fileStream.on('error', (err) => reject(err))

    s3.upload(
      {
        Bucket: env.MEET_BOT_S3_BUCKET,
        Key: key,
        Body: fileStream,
      },
      (s3Err, data) => {
        if (s3Err) return reject(s3Err)
        resolve(data)
      },
    )
  })
}
