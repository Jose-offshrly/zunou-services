# Laravel Jobs Documentation

This document provides comprehensive documentation for all Laravel Jobs in the Zunou API application. Each job entry answers five key questions for quick reference.

---

## Table of Contents

- [Vector Database & Embeddings](#vector-database--embeddings)
- [Google Calendar Integration](#google-calendar-integration)
- [Meeting & Companion](#meeting--companion)
- [Data Sources & File Processing](#data-sources--file-processing)
- [User & Organization Management](#user--organization-management)
- [AI & Insights](#ai--insights)
- [Tasks & Activities](#tasks--activities)
- [Notifications & Messaging](#notifications--messaging)
- [Scheduled & Maintenance Jobs](#scheduled--maintenance-jobs)
- [Middleware](#middleware)

---

## Vector Database & Embeddings

### AddDataToVectorDB

| Question | Answer |
|----------|--------|
| **What does it do?** | Adds manual data entries to the Pinecone vector database. Creates a DataSource record and generates embeddings for the provided data. |
| **When dispatched?** | When a user manually adds data that needs to be indexed for AI retrieval. |
| **Required data** | `$data` (string content), `$orgId` (organization ID), `$pulseId` (pulse ID) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default Laravel queue retry behavior. Throws exception on database rollback failure. |

### CreateOrganizationVectorIndexJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Creates a new Pinecone serverless index for an organization with 1536 dimensions (OpenAI embedding size), cosine metric, on AWS us-east-1. |
| **When dispatched?** | When a new organization is created (via `ZunouAiCreateOrganizationResourcesJob`). |
| **Required data** | `$organizationId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Throws exception if organization doesn't exist. Default retry behavior. |

### DeleteEmbeddingsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Deletes vector embeddings from Pinecone by their IDs within a specific namespace. |
| **When dispatched?** | When data sources or content is deleted and embeddings need cleanup. |
| **Required data** | `$orgId` (organization ID), `$namespace` (Pinecone namespace), `$ids` (array of vector IDs) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Re-throws exception with message on failure. |

### MarkPineconeRecordAsDeletedJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Marks vectors as deleted in Pinecone via the unstructured service API (soft delete). Updates metadata rather than physically deleting. |
| **When dispatched?** | When a DataSource is soft-deleted and its vectors should be marked as deleted. |
| **Required data** | `$dataSourceId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs warning and continues if DataSource not found. Logs error on API failure but doesn't re-throw. |

### NewPulseSeedToVectorDB

| Question | Answer |
|----------|--------|
| **What does it do?** | Seeds initial vector data for a newly created pulse using the `VectorDBSeedService`. |
| **When dispatched?** | When a new pulse is created and needs initial knowledge base data. |
| **Required data** | `$organizationId` (string), `$pulseId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs error but doesn't re-throw. Fails silently. |

### UpdateVectorByPineconeIdJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Updates an existing vector in Pinecone by its ID. Retrieves existing metadata and updates the vector with new data while preserving metadata. |
| **When dispatched?** | When content associated with a vector needs to be updated. |
| **Required data** | `$orgId`, `$pineconeId`, `$data` (new content), `$pulseId` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Throws exception if metadata not found or data source info missing. Re-throws on any error. |

### UpsertEmbeddingsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Upserts (insert or update) multiple vector documents into Pinecone in batch. |
| **When dispatched?** | When multiple documents need to be indexed at once. |
| **Required data** | `$orgId`, `$namespace`, `$documents` (array of documents with embeddings) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Re-throws exception with message on failure. |

---

## Google Calendar Integration

### CheckAndSetupGoogleCalendarWebhookJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Checks if a user needs Google Calendar webhook setup. Verifies if user has calendar linked, webhook exists, and connection is working. Dispatches `SetupUserGoogleCalendarWebhookJob` if needed. |
| **When dispatched?** | Periodically via scheduler or when user links Google Calendar. |
| **Required data** | `$user` (User model) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. Gracefully handles connection verification failures. |

### SetupUserGoogleCalendarWebhookJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Creates a Google Calendar push notification webhook for a user. Stops any existing webhook, refreshes tokens if needed, and creates a new watch channel with 7-day TTL. |
| **When dispatched?** | By `CheckAndSetupGoogleCalendarWebhookJob` when webhook setup is needed. |
| **Required data** | `$user` (User model), `$force` (bool, optional - forces recreation) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | **3 attempts** with exponential backoff: 1 min, 5 min, 15 min. Re-throws exceptions to trigger retry. |

### FetchGoogleCalendarEventsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Fetches Google Calendar events for ALL users with refresh tokens. Syncs events from current week through next week to personal pulses. |
| **When dispatched?** | Via scheduler for bulk calendar sync. |
| **Required data** | None (processes all eligible users) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Continues to next user on individual user failure. Logs errors. |

### FetchGoogleCalendarSourcedEventsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Similar to `FetchGoogleCalendarEventsJob` but creates events with source tracking using `CreateSourcedEventAction`. |
| **When dispatched?** | Via scheduler for bulk calendar sync with source tracking. |
| **Required data** | None (processes all eligible users) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Continues to next user on failure. Logs errors. |

### FetchUserGoogleCalendarEventsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Fetches Google Calendar events for a specific user. Syncs from today to 3 months ahead. Updates existing events or creates new ones. Dispatches `GoogleCalendarSyncCompleted` event. |
| **When dispatched?** | When a user manually triggers calendar sync or on-demand sync is needed. |
| **Required data** | `$user` (User model), `$args` (array with `input.pulseId`, `input.organizationId`) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs error with full trace. Doesn't re-throw. |

### FetchUserGoogleCalendarSourcedEventsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Fetches and syncs Google Calendar events for a specific user with full source tracking. Creates event instances and event owners. Filters out already imported events. |
| **When dispatched?** | When user triggers sync with source tracking enabled. |
| **Required data** | `$user` (User model), `$args` (array with `input.pulseId`, `input.organizationId`) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs error with full trace. Doesn't re-throw. |

### ProcessGoogleCalendarWebhookItemsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes Google Calendar webhook notifications. Expands recurring events to fetch all instances (1 week past, 13 weeks future), filters/deduplicates items, and dispatches chunk jobs for processing. |
| **When dispatched?** | When Google Calendar webhook notification is received. |
| **Required data** | `$userId` (string), `$items` (array of calendar items) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. Logs warnings for missing users. |

### ProcessGoogleCalendarWebhookItemsChunkJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes a chunk of Google Calendar webhook items (up to 50 items). Performs batch updates using raw SQL for performance. Creates new events or updates existing ones. Flushes updates every 10 items for "live" feedback. |
| **When dispatched?** | By `ProcessGoogleCalendarWebhookItemsJob` for each chunk. |
| **Required data** | `$userId`, `$items` (array), `$chunkIndex`, `$totalChunks` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs errors per item but continues processing. Falls back to individual updates if batch update fails. |

---

## Meeting & Companion

### CheckCompanionStatusJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Polls the companion bot status API for a meeting session. Updates meeting session status, broadcasts status changes, and ends meeting session when companion finishes. Self-dispatches for continuous polling. |
| **When dispatched?** | When a companion bot joins a meeting. Re-dispatches itself every N seconds until finished. |
| **Required data** | `$meetingSession` (MeetingSession model), `$pollInterval` (int, default 5 seconds) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Re-dispatches with delay on API errors (except for `finished` or `recorder_unavailable` status). |

### CheckSchedulerScaleJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Checks ECS capacity for companion bots. Triggers scale-up if only 1 spare instance remains. Throws exception if max instances reached. |
| **When dispatched?** | Before starting a new companion bot session. |
| **Required data** | Optional `$service` (SchedulerScaleService) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Re-throws exceptions. Throws specific exception when "bots all used up". |

### CheckDownscaleJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Triggers downscaling of companion bot ECS instances when no longer needed. |
| **When dispatched?** | After a meeting session ends (from `TranscriptQueueWorkerJob`). |
| **Required data** | Optional `$service` (SchedulerScaleService) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

### CleanMeetingSessionsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Cleans up meeting sessions where companion status is "not_admitted" and end time has passed. Updates status to ENDED. Processes in chunks of 100. |
| **When dispatched?** | Via scheduler for periodic cleanup. |
| **Required data** | None |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | **3 attempts**, **300 second timeout**. Re-throws exceptions. |

### CreateMeetingDataSourceJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Creates a DataSource for a meeting session after validating companion recording exists. |
| **When dispatched?** | After companion recording is confirmed available. |
| **Required data** | `$meetingSession` (MeetingSession model) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Returns early if pulse not found or no valid recording. |

### CreateNextMeetingSessionJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Creates the next meeting session instance for recurring meetings. Finds next event occurrence, creates new session, and schedules meeting summary reminder. |
| **When dispatched?** | When a recurring meeting session ends. |
| **Required data** | `$meetingSession` (MeetingSession model) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs errors for reminder scheduling failures but doesn't re-throw. |

### ProcessCompanionTranscriptJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes transcript from companion bot SQS queue. Creates meeting record via MeetingFacade with "companion" driver. |
| **When dispatched?** | When companion bot transcript is ready in SQS. |
| **Required data** | `$meetingSession`, `$dataSource`, `$pulse` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

### ProcessMeetingJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes a meeting from an integration (FireFlies). Delegates to `ProcessMeetingDataSourceAction`. |
| **When dispatched?** | When a meeting is imported from an external integration. |
| **Required data** | `$integration`, `$meeting`, `$dataSource`, `$organizationId` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

### ProcessMeetingPipilineJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes meeting through a pipeline (transcript upload, summary file). Creates DataSource, runs through Laravel Pipeline, then dispatches `ProcessFileDataSourceJob`. |
| **When dispatched?** | When meeting data needs full pipeline processing. |
| **Required data** | `$data` (MeetingData), `$meeting` (Meeting model) |
| **Queue / Priority** | Default queue (`ProcessFileDataSourceJob` dispatched to default) |
| **Failure & Retry** | Default behavior. |

### ProcessRecurringMeetingJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Tracks updates for recurring meetings. Validates meeting session has data source and transcript, then runs `TrackRecurringMeetingUpdatesAction`. |
| **When dispatched?** | 10 minutes before next recurring meeting session starts. |
| **Required data** | `$data` (array with `meeting_session_id`) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Throws exception if meeting session not found. Logs errors and returns early if data source or transcript missing. |

### TranscriptQueueWorkerJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Polls SQS queue for companion transcripts. Processes transcriptions, creates meetings, updates session status, dispatches `CreateNextMeetingSessionJob` for recurring meetings, and triggers downscale. |
| **When dispatched?** | Via scheduler for continuous SQS polling. |
| **Required data** | None (reads from SQS) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs errors and continues. Uses database transaction with lock for processing. |

---

## Data Sources & File Processing

### CleanupFailedDataSourcesJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Permanently deletes (force delete) data sources that have null/empty metadata OR FAILED status AND were created at least 30 minutes ago. Includes soft-deleted records. |
| **When dispatched?** | Via scheduler for periodic cleanup. |
| **Required data** | None |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Re-throws exception with message on failure. |

### ProcessFileDataSourceJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes uploaded files via the unstructured service API. Sends file to Flask endpoint for processing, receives vector IDs, queries Pinecone to verify indexing with retries. |
| **When dispatched?** | When a file data source is uploaded and needs processing. |
| **Required data** | `$dataSourceId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | **300 second timeout**. Marks DataSource as FAILED on error. Retries Pinecone query up to 10 times with 2-second delays. |

### ProcessVideoDataSourceJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes video data sources by adding name and description to vector database. Simpler than file processing - just indexes metadata. |
| **When dispatched?** | When a video file is uploaded as a data source. |
| **Required data** | `$dataSourceId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | **300 second timeout** (constant defined). Marks DataSource as FAILED on error. |

### ProcessXLSDataSourceJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes Excel/XLS data sources by adding name and description to vector database. Similar to video processing - indexes metadata only. |
| **When dispatched?** | When an Excel file is uploaded as a data source. |
| **Required data** | `$dataSourceId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Marks DataSource as FAILED on error. |

### ProcessSpreadsheetJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Queries a spreadsheet using AI via `SpreadSheetHelper`. Updates the original message with results and dispatches `AiResponseComplete` event. |
| **When dispatched?** | When a user queries a spreadsheet data source via chat. |
| **Required data** | `$prompt`, `$dataSourceId`, `$userId`, `$orgId`, `$pulseId`, `$threadId`, `$messageId` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Creates failure message on error. Logs errors. |

### ProcessLiveUploadJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Processes live uploaded files. Downloads from S3, generates AI summary using OpenAI, creates a message record for the upload. |
| **When dispatched?** | When a live upload status is UPLOADED. |
| **Required data** | `$liveUploadId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Marks LiveUpload as FAILED on error. |

### ProcessTranslationJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Translates a data source file to another language via dubbing service. Polls job status until complete, then adds translated content to vector DB and creates completion message. |
| **When dispatched?** | When a user requests file translation. |
| **Required data** | `$sourceDataSourceId`, `$targetDataSourceId`, `$targetLanguage`, `$userId`, `$threadId` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | **300 second timeout**. Marks target DataSource as FAILED on error. |

---

## User & Organization Management

### InviteUserJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Sends invitation email to a new or existing user being added to an organization. |
| **When dispatched?** | When a user is invited to an organization. |
| **Required data** | `$organizationUserId` (string), `$existing` (bool, default false) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior (email sending may fail). |

### InviteExistingUserJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Sends invitation email specifically for existing users being added to a new organization. Uses `InviteExistingUserMail` template. |
| **When dispatched?** | When an existing platform user is added to an organization. |
| **Required data** | `$organizationUser` (OrganizationUser model) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

### EnsureUserPersonalPulsesJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Ensures a user has personal pulses for all their organizations. Iterates through user's organizations and creates personal pulse if missing. |
| **When dispatched?** | After user registration or organization membership changes. |
| **Required data** | `$user` (User model) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Has `failed()` method that logs error message. |

### ZunouAiCreateOrganizationResourcesJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Creates AI resources for a new organization. Currently dispatches `CreateOrganizationVectorIndexJob` to create Pinecone index. |
| **When dispatched?** | When a new organization is created. |
| **Required data** | `$organizationId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Throws exception if organization not found. |

### ProcessPersonalizationJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Applies a personalization context for a user. Delegates to `PersonalizationContext->apply()`. |
| **When dispatched?** | When user personalization settings need to be processed. |
| **Required data** | `$personalizationContext` (PersonalizationContext) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

---

## AI & Insights

### CreateEventActionablesJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Extracts actionable tasks from meeting transcripts using GPT-4.1. Creates Actionable records for each extracted item and dispatches `EventActionablesCompleted` event. |
| **When dispatched?** | After a meeting is processed and transcript is available. |
| **Required data** | `$meeting` (Meeting model), `$eventId` (optional string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Catches all exceptions and logs - doesn't re-throw. |

### CreateTemporaryMessageJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Generates a friendly "loading" message while AI processes a user query. Uses GPT-4.1-mini to create contextual waiting messages. Dispatches `AIResponseDelayed` event. |
| **When dispatched?** | When AI processing will take noticeable time. |
| **Required data** | `$message` (Message model), `$pulseId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Returns fallback message on error. |

### GenerateRecommendationResultJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Generates detailed recommendation results for live insights. Classifies operation type, executes via appropriate agent (Task, Notes, Meeting, TeamChat), handles unsupported operations by converting to notes. |
| **When dispatched?** | By `InsightRecommendationGeneratorJob` for each recommendation. |
| **Required data** | `$rawRecommendation` (array), `$recommendation` (LiveInsightRecommendation), `$insight` (LiveInsightOutbox), `$siblings` (array) |
| **Queue / Priority** | `default` queue (explicitly set) |
| **Failure & Retry** | **3 retry attempts** with 1-second sleep between retries. Saves error state to recommendation on final failure. |

### InsightRecommendationGeneratorJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Generates 1-2 AI recommendations for live insights. Uses meeting context extraction and runs standalone agent to generate recommendations. Dispatches `GenerateRecommendationResultJob` for each. |
| **When dispatched?** | By `LiveInsightsWorkerJob` for insights without recommendations. |
| **Required data** | `$insightId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Catches exceptions, logs error, cleans up cache in finally block. Uses `LogQueryPerformanceMiddleware`. |

### LiveInsightsWorkerJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Worker job that finds live insights without recommendations and dispatches `InsightRecommendationGeneratorJob` for processing. Uses file cache to prevent duplicate processing. |
| **When dispatched?** | Via scheduler for continuous insight processing. |
| **Required data** | None |
| **Queue / Priority** | `default` queue (for dispatched jobs) |
| **Failure & Retry** | Logs errors and continues. Uses file cache with 10-minute TTL for processing locks. |

### PostProcessSummaryJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Post-processes meeting summaries to detect duplicate action items. Uses vector similarity search and AI verification to identify existing tasks. Updates summary with deduplicated action items. |
| **When dispatched?** | After meeting summary is generated. |
| **Required data** | `$summaryId`, `$organizationId`, `$pulseId` |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Throws exception if summary not found. |

### PreGenerateScoutRemindersJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Pre-generates scout reminder messages for all active users. Processes each organization user's pulses and generates TODAY and UPCOMING reminders. Broadcasts results via `ScoutReminderUpdated` event. |
| **When dispatched?** | Via scheduler (likely early morning) to pre-generate daily reminders. |
| **Required data** | None (processes all eligible users) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Catches exceptions per user and continues. Logs errors. |

---

## Tasks & Activities

### RecordTaskCreatedActivityJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Records activity feed entries when a task is created. Creates entries for pulse members and notifies assignees (excluding creator). |
| **When dispatched?** | When a new task is created. |
| **Required data** | `$task` (Task model), `$user` (array with user data) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Returns early if pulse is deleted. Default behavior otherwise. |

### RecordTaskUpdatedActivityJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Records activity feed entry when a task is updated. Logs changed fields in the activity description. |
| **When dispatched?** | When a task is updated. |
| **Required data** | `$task` (Task model), `$user` (array), `$changes` (array of changed fields) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

---

## Notifications & Messaging

### SendMessageSQS

| Question | Answer |
|----------|--------|
| **What does it do?** | Simple job that logs a message to SQS queue. Appears to be for debugging/testing purposes. |
| **When dispatched?** | Testing or specific SQS message logging scenarios. |
| **Required data** | `$message` (any serializable data) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

### ReportTopicUpdated

| Question | Answer |
|----------|--------|
| **What does it do?** | Updates or creates a system message in team chat when a topic is updated. Includes topic details, participant gravatars, and latest messages. |
| **When dispatched?** | When a topic in team chat is updated. |
| **Required data** | `$topicId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Returns early if topic not found or entity isn't TeamThread. |

---

## Scheduled & Maintenance Jobs

### AutoCheckoutTimesheets

| Question | Answer |
|----------|--------|
| **What does it do?** | Automatically checks out incomplete timesheets at 23:59 in each user's timezone. Creates a new timesheet starting at midnight the next day. |
| **When dispatched?** | Every minute via scheduler (checks each user's local time). |
| **Required data** | None |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Default behavior. |

### NewPulseSeedGettingStartedJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Seeds "Getting Started" items for a newly created pulse using `GettingStartedSeeder`. |
| **When dispatched?** | When a new pulse is created. |
| **Required data** | `$organizationId` (string), `$pulseId` (string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs error but doesn't re-throw. |

### ProcessAutomationJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Executes an automation workflow. Runs the automation and marks it as completed. |
| **When dispatched?** | When an automation is triggered (scheduled or event-based). |
| **Required data** | `$automationId` (string), `$isScheduled` (bool), `$dataSourceId` (optional string) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Logs error on failure. Always sets `on_queue = true` in finally block. |

### ProcessFireFliesMeetingsJob

| Question | Answer |
|----------|--------|
| **What does it do?** | Syncs meetings from FireFlies integration. Fetches user details and transcripts, stores them, and updates integration sync status. |
| **When dispatched?** | When FireFlies integration sync is triggered. |
| **Required data** | `$data` (IntegrationData), `$user` (User model) |
| **Queue / Priority** | Default queue |
| **Failure & Retry** | Updates integration status to FAILED on error. Always dispatches `FireFliesMeetingSynced` event. |

---

## Middleware

### LogQueryPerformanceMiddleware

| Question | Answer |
|----------|--------|
| **What does it do?** | Job middleware that logs database query performance metrics in development/testing environments. Reports total queries, execution time, and top 5 slowest queries. |
| **When used?** | Applied to jobs via `middleware()` method (e.g., `InsightRecommendationGeneratorJob`). |
| **Required data** | None (wraps job execution) |
| **Queue / Priority** | N/A (middleware) |
| **Failure & Retry** | N/A (passes through to job) |

---

## Common Patterns

### Default Queue Behavior
Most jobs use the default Laravel queue without specifying a queue name. To route jobs to specific queues, modify the dispatch call:

```php
MyJob::dispatch($data)->onQueue('high-priority');
```

### Retry Configuration
Jobs can be configured with retry attempts in several ways:

1. **Class property**: `public $tries = 3;`
2. **Backoff**: `public $backoff = [60, 300, 900];` (seconds)
3. **Timeout**: `public $timeout = 300;` (seconds)

### Error Handling Patterns
The codebase uses several error handling approaches:

1. **Re-throw for retry**: Exceptions are re-thrown to trigger Laravel's retry mechanism
2. **Log and continue**: Errors are logged but processing continues (batch operations)
3. **Mark as failed**: Associated models are updated with FAILED status
4. **Graceful degradation**: Fallback behavior on non-critical failures

### Common Dependencies
- **VectorDBService**: For Pinecone operations
- **GoogleCalendarService**: For Google Calendar API
- **OpenAI/OpenAIService**: For AI completions
- **S3Client**: For file storage operations

---

## Queue Configuration

Ensure your queue worker is configured to handle the expected workload:

```bash
# Single worker
php artisan queue:work

# With specific queue and options
php artisan queue:work --queue=default,high-priority --tries=3 --timeout=300

# Horizon (recommended for production)
php artisan horizon
```

For production deployments with Laravel Vapor, queues are automatically managed by AWS SQS.
