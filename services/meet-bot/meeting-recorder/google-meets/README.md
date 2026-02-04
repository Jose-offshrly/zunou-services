# Google meeting recorder bot

nodeJS project
runs on port 3000

## Handles following commands:

### Start recording

curl -X POST http://localhost:3000/start-meet-bot \
 -H "Content-Type: application/json" \
 -d '{"meetUrl": "https://meet.google.com/nzn-zqyr-cxy"}'

### Get transcription

curl -X GET http://localhost:3000/transcriptions

### Stop recording

curl -X POST http://localhost:3000/stop-meet-bot

### Check bot status

curl -X GET http://localhost:3000/bot-status

**Response includes:**
- `status`: Overall bot status (`idle`, `waiting_to_join`, `in_meeting`, `paused`, `stopping`, `finalizing`, `finished`, `not_admitted`)
- `core`: Core bot states (running, paused, joined, etc.)
- `meeting`: Current meeting information (ID, speakers, duration)
- `audio`: Audio processing status (buffer size, processing active)
- `transcription`: Transcription status (pending, log entries)
- `recording`: Recording infrastructure status (browser, page, stream)
- `system`: System-level status information

## Build

- make buildx
  -- for aws builds (amd64)

- make build
  -- for local (mac silicon) build

- make deploy
  -- deploy to aws ecr as latest

- bump 1