import type { Transform } from 'node:stream'

import type { FfmpegCommand } from 'fluent-ffmpeg'
import type { launch } from 'puppeteer-stream'

export type Browser = Awaited<ReturnType<typeof launch>>
export type Page = Awaited<ReturnType<Browser['newPage']>>

// Shared global variables
// Shared global state variables
export default {
  activeBrowser: null as Browser | null, // Active browser process
  activeProcess: null as FfmpegCommand | null, // Active recording process
  activeRecordings: {} as Record<string, (() => void) | null>, // store active recording processes
  activeStream: null as Transform | null, // Active audio stream
  audioBuffer: Buffer.alloc(0), // Shared audio buffer
  audioProcessingInterval: null as NodeJS.Timeout | null, // Audio processing interval
  currentRecordingPath: null as string | null, // Path to the recorded video/audio
  currentSpeaker: 'User', // Current active speaker
  hasJoined: false,
  joinedAt: null as number | null, // Timestamp when bot successfully joined the meeting
  heartbeatInterval: null as NodeJS.Timeout | null, // Heartbeat updater interval
  isBotPaused: false, // Flag to track bot pausing
  isBotRunning: false, // Flag to track bot status
  isClosing: false, // Flag to track bot closing
  isFinalizing: false, // Flag to track bot finalizing
  meetingId: null as string | null, // Active meeting ID
  page: null as Page | null, // Active browser page
  pendingTranscriptions: 0, // Pending transcriptions
  sessionDir: null as string | null, // Current meeting session directory
  stopTimeout: null as NodeJS.Timeout | null, // Timeout for stopping bot after max duration
  transcriptionLog: [] as string[], // Store transcriptions
  transcriptionLogPath: null as string | null, // Path to transcription log file (will contain Assembly.ai corrected version)
  chunkedTranscriptionLogPath: null as string | null, // Path to real-time chunked transcription log file (deprecated)
  fullTranscriptionLogPath: null as string | null, // Path to full audio transcription log file (deprecated)
  speakerTimelineLogPath: null as string | null, // Path to speaker timeline log file (NEW: replaces real-time transcription)
  // Full Audio Accumulation Mode
  fullAudioAccumulator: Buffer.alloc(0), // Accumulate entire audio for end-of-meeting processing
  isFullAccumulationMode: false, // Flag to indicate if we're in full accumulation mode
  meetingSpeakers: new Set<string>(), // Track all speakers who participated in the meeting
  speakerHistory: [] as Array<{ speaker: string; audioOffsetMs: number }>, // Track speaker at different audio positions
  currentAudioOffsetMs: 0, // Current position in accumulated audio (in milliseconds)
  lastSpeakerUpdate: 0, // Last time we recorded speaker info
  // AI-Enhanced Transcription Merging
  chunkedTranscriptions: [] as string[], // Store chunked transcriptions separately
  fullAudioTranscriptions: [] as string[], // Store full audio transcriptions separately
  // Logging throttling
  lastSpeakerLogTime: 0, // Last time we logged speaker information
  lastNoSpeakerLogTime: 0, // Last time we logged "no speakers" message
  // Audio simulation cleanup
  audioSimulationCleanup: null as (() => void) | null, // Function to cleanup audio simulation
  isUsingSimulatedAudio: false, // Flag to indicate if we're using simulated audio (bypass FFmpeg)
  // Platform information for audio processing
  meetingPlatform: 'google-meet' as string, // Current meeting platform (affects audio processing)
  // Modal suppression for Google Meet
  modalSuppressionInterval: null as NodeJS.Timeout | null, // Interval for continuous modal removal
  // Audio sample rate tracking
  currentAudioSampleRate: 16000, // Current audio sample rate (16000 Hz for Google Meet/Teams, 44100 Hz for Zoom)
  // Meeting timing for startup filtering
  meetingStartTime: null as number | null, // Timestamp when meeting was started
  // Bot display name
  botName: 'Pulse Companion' as string, // Display name for the bot
  // Participant roster for intelligent speaker selection
  participantRoster: new Map<string, { name: string; lastActive: number; activityCount: number }>(),
  lastParticipantRosterUpdate: 0,
  // Track when current speaker started their continuous speaking period
  currentSpeakerStartTime: 0,
  // Log of speaker changes with precise timestamps for post-processing correlation
  speakerChangeLog: [] as Array<{ timestamp: number; speaker: string; isoTimestamp: string }>,
  // Brain dump: one person talking to the bot (no other participants)
  meetingType: 'regular' as 'regular' | 'brain-dump',
  // Real-time audio chunk tracking for speaker correlation
  audioChunkTimeline: [] as Array<{ timestamp: number; speaker: string; durationMs: number }>,
}
