import { createId } from '@paralleldrive/cuid2'

const SCEHUDLER_BASE_URL = 'http://localhost:8000'

const [, , meetUrlOrId, command = 'start'] = process.argv

if (meetUrlOrId.startsWith('https://meet.google.com')) {
  const meetUrl = new URL(meetUrlOrId).href

  const response = await fetch(new URL('start-meeting', SCEHUDLER_BASE_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meeting_id: createId(),
      meetUrl,
      companionName: process.argv[3] || null, // Optional companion name as 3rd argument
    }),
  })

  if (!response.ok) throw new Error(await response.text())

  console.log(await response.json())
  process.exit(0)
}

const meetingId = meetUrlOrId

if (command === 'status') {
  // Meeting ID is now required for status requests
  if (!meetingId || meetingId === 'any-value' || meetingId === 'test') {
    console.log('❌ Error: Meeting ID is required for status requests')
    console.log('Usage: node manual-meeting.js <meeting-id> status [debug]')
    console.log('Example: node manual-meeting.js abc-def-ghi status')
    console.log('Example: node manual-meeting.js abc-def-ghi status debug  # For detailed bot communication')
    process.exit(1)
  }
  
  // Check if debug mode is requested (4th argument)
  const debugMode = process.argv[4] === 'debug'
  const queryParam = `?meeting_id=${encodeURIComponent(meetingId)}${debugMode ? '&debug=true' : ''}`
  
  const response = await fetch(new URL(`bot-status${queryParam}`, SCEHUDLER_BASE_URL), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      const error = await response.json()
      console.log('❌ Meeting Not Found:')
      console.log(`   Requested: ${meetingId}`)
      console.log(`   Current: ${error.currentMeetingId || 'None'}`)
      console.log(`   Bot ID: ${error.botId}`)
      process.exit(1)
    } else if (response.status === 400) {
      const error = await response.json()
      console.log('❌ Bad Request:', error.message)
      process.exit(1)
    }
    throw new Error(await response.text())
  }

  const status = await response.json()
  console.log('🤖 Bot Status:')
  console.log('================')
  console.log(`Overall Status: ${status.status}`)
  console.log(`Bot ID: ${status.botId || 'N/A'}`)
  console.log(`Requested Meeting: ${meetingId}`)
  console.log(`Timestamp: ${status.timestamp}`)
  if (status.scheduler) {
    console.log(`Communication Method: ${status.scheduler.communicationMethod}`)
  }
  console.log()
  
  if (status.core) {
    console.log('Core States:')
    console.log(`  Running: ${status.core.isBotRunning}`)
    console.log(`  Paused: ${status.core.isBotPaused}`)
    console.log(`  Joined: ${status.core.hasJoined}`)
    console.log(`  Closing: ${status.core.isClosing}`)
    console.log(`  Finalizing: ${status.core.isFinalizing}`)
    console.log()
  }
  
  if (status.meeting) {
    console.log('Meeting Info:')
    console.log(`  Meeting ID: ${status.meeting.meetingId || 'None'}`)
    console.log(`  Is Active: ${status.meeting.isActiveMeeting}`)
    console.log(`  Current Speaker: ${status.meeting.currentSpeaker || 'None'}`)
    console.log(`  Speaker Count: ${status.meeting.speakerCount || 0}`)
    console.log(`  Session Duration: ${Math.round((status.meeting.sessionDurationMs || 0) / 1000)}s`)
    if (status.meeting.sessionStartTime) {
      console.log(`  Session Started: ${status.meeting.sessionStartTime}`)
    }
    if (status.meeting.meetingSpeakers && status.meeting.meetingSpeakers.length > 0) {
      console.log(`  Meeting Speakers: ${status.meeting.meetingSpeakers.join(', ')}`)
    }
    console.log()
  }
  
  if (status.recordings) {
    console.log('Recordings:')
    console.log(`  Active Meeting IDs: ${status.recordings.activeMeetingIds?.length > 0 ? status.recordings.activeMeetingIds.join(', ') : 'None'}`)
    console.log(`  Has Active Browser: ${status.recordings.hasActiveBrowser}`)
    console.log(`  Has Active Stream: ${status.recordings.hasActiveStream}`)
    console.log()
  }
  
  if (status.audio) {
    console.log('Audio Processing:')
    console.log(`  Audio Processing Active: ${status.audio.isAudioProcessingActive}`)
    console.log(`  Buffer Size: ${status.audio.audioBufferSize} bytes`)
    console.log(`  Buffer Duration: ${status.audio.audioBufferDurationMs}ms`)
    console.log(`  Full Accumulation Mode: ${status.audio.isFullAccumulationMode}`)
    console.log()
  }
  
  if (status.transcription) {
    console.log('Transcription:')
    console.log(`  Pending: ${status.transcription.pendingTranscriptions}`)
    console.log(`  Log Entries: ${status.transcription.transcriptionLogEntries}`)
    console.log(`  Chunked Transcriptions: ${status.transcription.chunkedTranscriptions}`)
    console.log()
  }
  
  if (status.system) {
    console.log('System:')
    console.log(`  Max Concurrent Meetings: ${status.system.maxConcurrentMeetings}`)
    if (status.system.hostInfo) {
      console.log(`  Platform: ${status.system.hostInfo.platform}`)
      console.log(`  Node Version: ${status.system.hostInfo.nodeVersion}`)
      console.log(`  Process ID: ${status.system.hostInfo.pid}`)
    }
    console.log()
  }
  
  if (status.error) {
    console.log('⚠️  Error:', status.error)
    console.log('Message:', status.message)
  }
  
  process.exit(0)
} else if (command === 'stop') {
  const response = await fetch(new URL('stop-meeting', SCEHUDLER_BASE_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meeting_id: meetingId }),
  })
  if (!response.ok) throw new Error(await response.text())

  console.log(await response.json())
} else if (command === 'pause') {
  const response = await fetch(new URL('pause-meeting', SCEHUDLER_BASE_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meeting_id: meetingId }),
  })
  if (!response.ok) throw new Error(await response.text())

  console.log(await response.json())
} else if (command === 'resume') {
  const response = await fetch(new URL('resume-meeting', SCEHUDLER_BASE_URL), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meeting_id: meetingId }),
  })
  if (!response.ok) throw new Error(await response.text())

  console.log(await response.json())
} else {
  throw new Error(`Unknown command: ${command}`)
}
