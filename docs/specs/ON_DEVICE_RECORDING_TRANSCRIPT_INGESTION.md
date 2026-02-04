# Backend Spec: On-Device Recording Transcript Ingestion

**Date:** December 16, 2025  
**Status:** Requested  
**Priority:** High  
**Requestor:** Frontend Team  

---

## Overview

Enable users to record meetings directly from their device (phone/tablet) and have the transcript processed and linked to a calendar event. Currently, transcripts can only be ingested via the Companion Bot integration. This spec requests backend changes to support on-device recording ingestion.

---

## Current Data Model

```
Event
  └── meetingSession (MeetingSession)
        ├── event_id (links back to Event)
        ├── dataSource (DataSource) ← Transcript lives here
        └── status, type, pulseId, organizationId, etc.

DataSource
  ├── meeting (Meeting)
  │     └── meetingSession (MeetingSession)
  │           └── event_id
  ├── transcript (Transcript)
  │     └── id
  ├── status (PENDING, PROCESSING, COMPLETED, FAILED)
  └── origin (INTEGRATION, MEETING, NOTE)

Meeting
  ├── pulseId, title, date, participants
  ├── dataSourceId
  └── meetingSession (MeetingSession)
```

**Key Relationship Chain:** `Event → MeetingSession → DataSource → Transcript`

The past event page queries `event.meetingSession.dataSource` to display transcript data.

---

## Problem Statement

The existing `CreateMeetingInput` does not support linking a transcript to a calendar event:

```typescript
// Current CreateMeetingInput
export type CreateMeetingInput = {
  metadata?: { fileKey, fileName };
  participants?: string;
  pulseId: ID!;
  title: string!;
  transcript?: string;
  // ❌ No event_id field
  // ❌ No meetingSessionId field
};
```

When `createMeeting` is called:
- A `Meeting` record is created
- A `DataSource` may be created
- But there's **no link to the calendar Event**
- The past event page shows no transcript because `event.meetingSession.dataSource` is null

---

## Proposed Solution

### Add `event_id` to `CreateMeetingInput`

Extend the existing mutation input to accept an optional `event_id`:

```typescript
export type CreateMeetingInput = {
  metadata?: MetadataInput;
  participants?: string;
  pulseId: ID!;
  title: string!;
  transcript?: string;
  event_id?: ID;              // NEW - Optional link to calendar event
  event_instance_id?: ID;     // NEW - Optional for recurring events
};
```

---

## Backend Logic for `createMeeting` Resolver

When `event_id` is provided in the input:

### Step 1: Validate Event Access
```
- Verify event exists with given event_id
- Verify user has access to this event (same org/pulse)
- If invalid, return error: "Event not found or access denied"
```

### Step 2: Handle MeetingSession
```
IF event.meetingSession exists:
    - Use the existing MeetingSession
    - Update status to 'ENDED' if not already
ELSE:
    - Create new MeetingSession:
        {
          event_id: input.event_id,
          event_instance_id: input.event_instance_id,  // if provided
          pulseId: input.pulseId,
          organizationId: <from context>,
          userId: <from context>,
          type: 'MEETING',
          status: 'ENDED',
          name: input.title,
          start_at: event.start_at,
          end_at: event.end_at,
          invite_pulse: false
        }
```

### Step 3: Create Meeting Record
```
Create Meeting:
    {
      pulseId: input.pulseId,
      userId: <from context>,
      title: input.title,
      date: event.date or NOW,
      transcript: input.transcript,
      participants: input.participants,
      source: 'ON_DEVICE',  // or 'MANUAL'
      status: 'added'
    }
```

### Step 4: Create DataSource
```
Create DataSource:
    {
      name: input.title,
      description: "On-device recording transcript",
      organizationId: <from context>,
      pulseId: input.pulseId,
      type: 'MEETING',
      origin: 'ON_DEVICE',  // NEW enum value (see below)
      status: 'PENDING',
      is_viewable: true
    }
```

### Step 5: Create Transcript Record
```
Create Transcript:
    {
      content: input.transcript,
      dataSourceId: <created DataSource ID>
    }
```

### Step 6: Link Everything Together
```
- Meeting.dataSourceId = DataSource.id
- Meeting.meetingSession = MeetingSession
- MeetingSession.dataSource = DataSource  // CRITICAL for past event page
- DataSource.meeting = Meeting
- DataSource.transcript = Transcript
```

### Step 7: Trigger AI Processing Pipeline
```
- Queue DataSource for AI processing (summary, actionables, takeaways)
- Update DataSource.status to 'PROCESSING'
- When complete, update to 'COMPLETED'
```

---

## New Enum Value

Add a new origin type to `DataSourceOrigin`:

```typescript
export enum DataSourceOrigin {
  Integration = 'INTEGRATION',
  Meeting = 'MEETING',
  Note = 'NOTE',
  OnDevice = 'ON_DEVICE'      // NEW
}
```

This allows the system to distinguish between:
- `INTEGRATION` - External integrations (Zoom, Teams, etc.)
- `MEETING` - Companion Bot recordings
- `ON_DEVICE` - User recorded on their device

---

## Expected Response

The `createMeeting` mutation should return the full `MeetingFragment` including the linked `meetingSession`:

```json
{
  "data": {
    "createMeeting": {
      "id": "meeting-uuid",
      "title": "Team Standup",
      "date": "2025-12-16",
      "status": "added",
      "dataSourceId": "ds-uuid",
      "meetingSession": {
        "id": "ms-uuid",
        "event_id": "event-uuid",
        "status": "ENDED",
        "dataSource": {
          "id": "ds-uuid",
          "status": "PROCESSING",
          "transcript": {
            "id": "tr-uuid"
          }
        }
      }
    }
  }
}
```

---

## Frontend Usage

Once implemented, the frontend will call:

```javascript
const meetingInput = {
  pulseId: pulseId,
  title: event.name,
  transcript: transcriptText,        // Full transcript with speaker labels
  participants: "John, Sarah, Mike", // Comma-separated speaker names
  event_id: event.id                 // Links to calendar event
};

const result = await window.createMeetingMutation(meetingInput, token);
```

After success, navigating to `#event/{event_id}/past` will show:
- ✅ Transcript in the transcript viewer
- ✅ AI-generated summary (after processing)
- ✅ Actionables extracted from transcript
- ✅ Takeaways and highlights

---

## Transcript Format

The frontend will send transcripts in this format:

```
Speaker A: Hello everyone, let's get started with today's standup.

Speaker B: Sure. Yesterday I worked on the authentication module and today I'll be finishing up the API integration.

Speaker A: Great progress. Any blockers?

Speaker B: No blockers currently.
```

Or with timestamps (optional enhancement):

```
[00:00:15] John: Hello everyone, let's get started.
[00:00:22] Sarah: Sure. Yesterday I worked on the authentication module.
```

The backend should handle both formats in the AI processing pipeline.

---

## Error Handling

| Scenario | Error Response |
|----------|----------------|
| Invalid `event_id` | `{ error: "Event not found" }` |
| No access to event | `{ error: "Access denied to event" }` |
| Event in different org | `{ error: "Event belongs to different organization" }` |
| Empty transcript | `{ error: "Transcript cannot be empty" }` |
| Event already has processed transcript | Consider: Allow overwrite? Or `{ error: "Event already has a transcript" }` |

---

## Migration Considerations

- Existing `createMeeting` calls without `event_id` should continue to work as before (standalone meetings)
- The `event_id` field is optional to maintain backward compatibility
- No database migrations needed if MeetingSession already has `dataSource` field

---

## Testing Checklist

- [ ] Create meeting with `event_id` → MeetingSession created/linked
- [ ] Create meeting with `event_id` when event already has MeetingSession → Uses existing
- [ ] Past event page shows transcript after creation
- [ ] AI processing triggers and completes
- [ ] Summary, actionables, takeaways populate correctly
- [ ] Create meeting without `event_id` → Works as before (backward compatible)

---

## Questions for Backend Team

1. **Overwrite behavior:** If an event already has a transcript (from bot or previous recording), should we:
   - Allow overwrite?
   - Return error?
   - Create a new version?

2. **Processing priority:** Should on-device transcripts get the same AI processing as bot transcripts (summary, actionables, sentiment analysis)?

3. **Audio storage:** Future enhancement - should we add an optional `audioFileUrl` field for storing the original audio recording?

---

## Timeline Request

This is blocking the on-device recording feature which is ready on the frontend. Requesting implementation in the next sprint.

---

## Contact

For questions about this spec, reach out to the frontend team or reference the `ON_DEVICE_RECORDING_SPEC.md` for full feature context.
