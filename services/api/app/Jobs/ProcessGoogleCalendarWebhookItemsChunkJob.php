<?php

namespace App\Jobs;

use App\Actions\Event\CreateEventInstanceAction;
use App\Actions\Event\CreateEventOwnerAction;
use App\Actions\Event\CreateSourcedEventAction;
use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Enums\EventSourceType;
use App\Models\Event;
use App\Models\Pulse;
use App\Models\User;
use App\Services\Calendar\GoogleCalendarService;
use App\Traits\ExtractsGoogleMeetUrl;
use App\Traits\ReconciliatesGoogleCalendarEvents;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessGoogleCalendarWebhookItemsChunkJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use ExtractsGoogleMeetUrl;
    use Queueable;
    use ReconciliatesGoogleCalendarEvents;
    use SerializesModels;

    /**
     * Flush batch updates every N items for more "live" updates.
     */
    public const FLUSH_BATCH_EVERY = 10;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $userId,
        public array $items,
        public int $chunkIndex,
        public int $totalChunks
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(
        CreateSourcedEventAction $createSourcedEventAction,
        CreateEventOwnerAction $createEventOwnerAction,
        CreateEventInstanceAction $createEventInstanceAction
    ): void {
        $user = $this->resolveUser();
        if (!$user) {
            return;
        }

        Log::info(
            'ProcessGoogleCalendarWebhookItemsChunkJob: Starting chunk processing',
            [
                'user_id' => $user->id,
                'chunk_index' => $this->chunkIndex,
                'total_chunks' => $this->totalChunks,
                'items_count' => count($this->items),
            ]
        );

        $pulses = $this->getUserPulses($user);
        $calendarEventService = $this->makeCalendarEventService($user);

        // Batch-load existing events to avoid N+1
        $googleEventIds = collect($this->items)
            ->pluck('id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $existingEventsMap = $this->prefetchExistingEvents(
            $user,
            $googleEventIds
        );

        // Collect batch updates and creates
        $eventsToUpdate = [];
        $eventsToCreate = [];
        $itemsProcessed = 0;
        $totalUpdates = 0;
        $totalCreates = 0;

        foreach ($this->items as $item) {
            try {
                $this->processItem(
                    user: $user,
                    item: $item,
                    pulses: $pulses,
                    existingEventsMap: $existingEventsMap,
                    calendarEventService: $calendarEventService,
                    createSourcedEventAction: $createSourcedEventAction,
                    createEventOwnerAction: $createEventOwnerAction,
                    createEventInstanceAction: $createEventInstanceAction,
                    eventsToUpdate: $eventsToUpdate,
                    eventsToCreate: $eventsToCreate
                );
            } catch (\Exception $e) {
                Log::error('Failed to process webhook item in chunk job', [
                    'user_id' => $user->id,
                    'chunk_index' => $this->chunkIndex,
                    'google_event_id' => $item['id'] ?? null,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            $itemsProcessed++;

            // Flush batch updates periodically for more "live" updates
            if (
                $itemsProcessed % self::FLUSH_BATCH_EVERY === 0 &&
                !empty($eventsToUpdate)
            ) {
                $this->performBatchUpdates($eventsToUpdate, $user);
                $totalUpdates += count($eventsToUpdate);
                $totalCreates += count($eventsToCreate);
                $eventsToUpdate = [];
                $eventsToCreate = [];

                Log::debug('Flushed batch updates mid-chunk', [
                    'user_id' => $user->id,
                    'chunk_index' => $this->chunkIndex,
                    'items_processed' => $itemsProcessed,
                    'total_items' => count($this->items),
                ]);
            }
        }

        // Flush any remaining updates
        if (!empty($eventsToUpdate)) {
            $this->performBatchUpdates($eventsToUpdate, $user);
            $totalUpdates += count($eventsToUpdate);
            $totalCreates += count($eventsToCreate);
        }

        // On the last chunk, run reconciliation to clean up orphaned events
        $orphanedDeleted = 0;
        if ($this->chunkIndex === $this->totalChunks) {
            $windowStart = now()
                ->subWeeks(
                    ProcessGoogleCalendarWebhookItemsJob::SYNC_WEEKS_PAST
                )
                ->startOfDay();
            $windowEnd = now()
                ->addWeeks(
                    ProcessGoogleCalendarWebhookItemsJob::SYNC_WEEKS_FUTURE
                )
                ->endOfDay();
            $orphanedDeleted = $this->reconcileOrphanedEvents(
                user: $user,
                calendarEventService: $calendarEventService,
                windowStart: $windowStart,
                windowEnd: $windowEnd,
                pulseIds: null, // Reconcile all pulses for webhook sync
                logContext: ['chunk_index' => $this->chunkIndex]
            );
        }

        Log::info(
            'ProcessGoogleCalendarWebhookItemsChunkJob: Completed chunk processing',
            [
                'user_id' => $user->id,
                'chunk_index' => $this->chunkIndex,
                'total_chunks' => $this->totalChunks,
                'items_count' => count($this->items),
                'updates_count' => $totalUpdates,
                'creates_count' => $totalCreates,
                'orphaned_deleted' => $orphanedDeleted,
            ]
        );
    }

    /**
     * Perform batch updates for existing events using a single query per batch.
     */
    private function performBatchUpdates(
        array $eventsToUpdate,
        User $user
    ): void {
        if (empty($eventsToUpdate)) {
            return;
        }

        // Group updates by the data being changed to minimize queries
        // Use CASE statements for bulk update
        $eventIds = array_keys($eventsToUpdate);

        if (empty($eventIds)) {
            return;
        }

        try {
            DB::transaction(function () use ($eventsToUpdate, $eventIds) {
                // Build the CASE statement for each field
                $nameCase = 'CASE id ';
                $dateCase = 'CASE id ';
                $startAtCase = 'CASE id ';
                $endAtCase = 'CASE id ';
                $linkCase = 'CASE id ';
                $locationCase = 'CASE id ';
                $descriptionCase = 'CASE id ';
                $guestsCase = 'CASE id ';
                $googleEventIdCase = 'CASE id ';

                // Collect bindings per field (SQL expects all name bindings first, then all date bindings, etc.)
                $nameBindings = [];
                $dateBindings = [];
                $startAtBindings = [];
                $endAtBindings = [];
                $linkBindings = [];
                $locationBindings = [];
                $descriptionBindings = [];
                $guestsBindings = [];
                $googleEventIdBindings = [];

                foreach ($eventsToUpdate as $eventId => $data) {
                    $nameCase .= 'WHEN ? THEN ? ';
                    $dateCase .= 'WHEN ? THEN ? ';
                    $startAtCase .= 'WHEN ? THEN ? ';
                    $endAtCase .= 'WHEN ? THEN ? ';
                    $linkCase .= 'WHEN ? THEN ? ';
                    $locationCase .= 'WHEN ? THEN ? ';
                    $descriptionCase .= 'WHEN ? THEN ? ';
                    $guestsCase .= 'WHEN ? THEN ? ';
                    $googleEventIdCase .= 'WHEN ? THEN ? ';

                    // Name bindings
                    $nameBindings[] = $eventId;
                    $nameBindings[] = $data['name'];

                    // Date bindings
                    $dateBindings[] = $eventId;
                    $dateBindings[] = $data['date'];

                    // Start at bindings
                    $startAtBindings[] = $eventId;
                    $startAtBindings[] = $data['start_at'];

                    // End at bindings
                    $endAtBindings[] = $eventId;
                    $endAtBindings[] = $data['end_at'];

                    // Link bindings
                    $linkBindings[] = $eventId;
                    $linkBindings[] = $data['link'];

                    // Location bindings
                    $locationBindings[] = $eventId;
                    $locationBindings[] = $data['location'];

                    // Description bindings
                    $descriptionBindings[] = $eventId;
                    $descriptionBindings[] = $data['description'];

                    // Guests bindings (JSON)
                    $guestsBindings[] = $eventId;
                    $guestsBindings[] = json_encode($data['guests']);

                    // Google Event ID bindings (important for recurring events when time changes)
                    $googleEventIdBindings[] = $eventId;
                    $googleEventIdBindings[] = $data['google_event_id'];
                }

                $nameCase .= 'ELSE name END';
                $dateCase .= 'ELSE date END';
                $startAtCase .= 'ELSE start_at END';
                $endAtCase .= 'ELSE end_at END';
                $linkCase .= 'ELSE link END';
                $locationCase .= 'ELSE location END';
                $descriptionCase .= 'ELSE description END';
                $guestsCase .= 'ELSE guests END';
                $googleEventIdCase .= 'ELSE google_event_id END';

                // Build placeholders for WHERE IN clause
                $placeholders = implode(
                    ',',
                    array_fill(0, count($eventIds), '?')
                );

                // Merge bindings in the order they appear in the SQL (field by field, not event by event)
                $bindings = array_merge(
                    $nameBindings,
                    $dateBindings,
                    $startAtBindings,
                    $endAtBindings,
                    $linkBindings,
                    $locationBindings,
                    $descriptionBindings,
                    $guestsBindings,
                    $googleEventIdBindings,
                    $eventIds
                );

                $sql = "UPDATE events SET
                    name = {$nameCase},
                    date = {$dateCase},
                    start_at = {$startAtCase},
                    end_at = {$endAtCase},
                    link = {$linkCase},
                    location = {$locationCase},
                    description = {$descriptionCase},
                    guests = {$guestsCase},
                    google_event_id = {$googleEventIdCase},
                    updated_at = NOW()
                WHERE id IN ({$placeholders})";

                DB::update($sql, $bindings);
            });

            Log::info('Batch updated events', [
                'count' => count($eventsToUpdate),
            ]);
        } catch (\Exception $e) {
            Log::error(
                'Batch update failed, falling back to individual updates',
                [
                    'error' => $e->getMessage(),
                ]
            );

            // Fallback to individual updates if batch fails
            foreach ($eventsToUpdate as $eventId => $data) {
                try {
                    Event::where('id', $eventId)->update([
                        'name' => $data['name'],
                        'date' => $data['date'],
                        'start_at' => $data['start_at'],
                        'end_at' => $data['end_at'],
                        'link' => $data['link'],
                        'location' => $data['location'],
                        'description' => $data['description'],
                        'guests' => $data['guests'],
                    ]);
                } catch (\Exception $updateException) {
                    Log::error('Individual event update failed', [
                        'event_id' => $eventId,
                        'error' => $updateException->getMessage(),
                    ]);
                }
            }
        }
    }

    /**
     * @return array<string, Event> keyed by "pulse_id:google_event_id" and also "pulse_id:baseId:date"
     */
    private function prefetchExistingEvents(
        User $user,
        array $googleEventIds
    ): array {
        if (empty($googleEventIds)) {
            return [];
        }

        // Extract base IDs for recurring events to also match by base ID
        $baseIds = [];
        foreach ($googleEventIds as $googleEventId) {
            if (str_contains($googleEventId, '_')) {
                $baseIds[] = $this->extractBaseEventId($googleEventId);
            }
        }
        $baseIds = array_unique($baseIds);

        // Query for exact matches AND base ID matches (for recurring events)
        $query = Event::where('user_id', $user->id);

        if (!empty($baseIds)) {
            $query->where(function ($q) use ($googleEventIds, $baseIds) {
                $q->whereIn('google_event_id', $googleEventIds);
                foreach ($baseIds as $baseId) {
                    $q->orWhere('google_event_id', 'LIKE', $baseId . '_%');
                }
            });
        } else {
            $query->whereIn('google_event_id', $googleEventIds);
        }

        $events = $query->get();

        $map = [];
        foreach ($events as $event) {
            // Key by exact google_event_id
            $key = $event->pulse_id . ':' . $event->google_event_id;
            $map[$key] = $event;

            // Also key by base ID + date for recurring event matching
            if (str_contains($event->google_event_id, '_')) {
                $baseId = $this->extractBaseEventId($event->google_event_id);
                $eventDate = $this->extractDateFromRecurringEventId(
                    $event->google_event_id
                );
                if ($eventDate) {
                    $dateKey =
                        $event->pulse_id .
                        ':' .
                        $baseId .
                        ':' .
                        $eventDate->format('Y-m-d');
                    $map[$dateKey] = $event;
                }
            }
        }

        return $map;
    }

    /**
     * Resolve the user for this job.
     */
    private function resolveUser(): ?User
    {
        $user = User::find($this->userId);

        if (!$user) {
            Log::warning(
                'ProcessGoogleCalendarWebhookItemsChunkJob: User not found',
                [
                    'user_id' => $this->userId,
                    'chunk_index' => $this->chunkIndex,
                ]
            );
        }

        return $user;
    }

    /**
     * Get pulses the user is a member of.
     */
    private function getUserPulses(User $user)
    {
        return Pulse::whereHas('members', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->get();
    }

    /**
     * Build the calendar event service for the given user.
     */
    private function makeCalendarEventService(User $user): GoogleCalendarService
    {
        return new GoogleCalendarService($user);
    }

    private function processItem(
        User $user,
        array $item,
        $pulses,
        array &$existingEventsMap,
        GoogleCalendarService $calendarEventService,
        CreateSourcedEventAction $createSourcedEventAction,
        CreateEventOwnerAction $createEventOwnerAction,
        CreateEventInstanceAction $createEventInstanceAction,
        array &$eventsToUpdate,
        array &$eventsToCreate
    ): void {
        $googleEventId = $item['id'] ?? null;
        $status = $item['status'] ?? 'confirmed';
        $recurringEventId = $item['recurring_meeting_id'] ?? null;
        $originalStartTime = $item['originalStartTime'] ?? null;

        if (!$googleEventId) {
            return;
        }

        Log::debug('Processing webhook item', [
            'user_id' => $user->id,
            'google_event_id' => $googleEventId,
            'status' => $status,
            'recurring_event_id' => $recurringEventId,
            'chunk_index' => $this->chunkIndex,
        ]);

        $isEventInstance = $this->logInstanceIfApplicable(
            user: $user,
            googleEventId: $googleEventId,
            recurringEventId: $recurringEventId,
            originalStartTime: $originalStartTime
        );

        if ($status === 'cancelled') {
            $this->deleteCancelledEvent($user, $googleEventId);

            return;
        }

        $item = $this->hydrateFullEventPayload(
            user: $user,
            googleEventId: $googleEventId,
            recurringEventId: $recurringEventId,
            isEventInstance: $isEventInstance,
            item: $item,
            calendarEventService: $calendarEventService
        );

        // If we can't fetch the event from Google, it might have been deleted
        // Try to delete it from our DB as well
        if (!$item) {
            Log::info(
                'Event not found on Google, attempting to delete from DB',
                [
                    'user_id' => $user->id,
                    'google_event_id' => $googleEventId,
                    'recurring_event_id' => $recurringEventId,
                    'chunk_index' => $this->chunkIndex,
                ]
            );

            $this->deleteCancelledEvent($user, $googleEventId);

            return;
        }

        [$eventStartTime, $eventEndTime] = $this->resolveEventTimes(
            user: $user,
            googleEventId: $googleEventId,
            recurringEventId: $recurringEventId,
            isEventInstance: $isEventInstance,
            item: $item
        );

        if (!$eventStartTime || !$eventEndTime) {
            return;
        }

        // For recurring events, also prepare the base ID + date key for lookup
        $isRecurringEvent = str_contains($googleEventId, '_');
        $baseIdDateKey = null;
        if ($isRecurringEvent) {
            $baseId = $this->extractBaseEventId($googleEventId);
            $eventDate = Carbon::instance($eventStartTime)->format('Y-m-d');
            $baseIdDateKey = $baseId . ':' . $eventDate;
        }

        foreach ($pulses as $pulse) {
            // Try exact match first
            $existing =
                $existingEventsMap[$pulse->id . ':' . $googleEventId] ?? null;

            // For recurring events, also try matching by base ID + date
            if (!$existing && $baseIdDateKey) {
                $existing =
                    $existingEventsMap[$pulse->id . ':' . $baseIdDateKey] ??
                    null;
                if ($existing) {
                    Log::debug(
                        'Found existing recurring event by base ID + date',
                        [
                            'user_id' => $user->id,
                            'pulse_id' => $pulse->id,
                            'incoming_event_id' => $googleEventId,
                            'stored_event_id' => $existing->google_event_id,
                            'base_id_date_key' => $baseIdDateKey,
                        ]
                    );
                }
            }

            if ($existing) {
                $this->collectEventUpdate(
                    existing: $existing,
                    user: $user,
                    pulse: $pulse,
                    item: $item,
                    eventStartTime: $eventStartTime,
                    eventEndTime: $eventEndTime,
                    googleEventId: $googleEventId,
                    recurringEventId: $recurringEventId,
                    isEventInstance: $isEventInstance,
                    eventsToUpdate: $eventsToUpdate
                );

                continue;
            }

            // Skip creating new recurring events that fall outside the sync window
            if (!$this->isEventWithinSyncWindow($eventStartTime)) {
                Log::debug(
                    'Skipping event creation - event is outside sync window',
                    [
                        'user_id' => $user->id,
                        'pulse_id' => $pulse->id,
                        'google_event_id' => $googleEventId,
                        'event_start_time' => $eventStartTime,
                    ]
                );

                continue;
            }

            $newEvent = $this->createNewEventAndInstance(
                user: $user,
                pulse: $pulse,
                item: $item,
                eventStartTime: $eventStartTime,
                eventEndTime: $eventEndTime,
                googleEventId: $googleEventId,
                recurringEventId: $recurringEventId,
                isEventInstance: $isEventInstance,
                createSourcedEventAction: $createSourcedEventAction,
                createEventOwnerAction: $createEventOwnerAction,
                createEventInstanceAction: $createEventInstanceAction
            );

            // Track newly created event for deduplication within this batch
            if ($newEvent) {
                $existingEventsMap[
                    $pulse->id . ':' . $googleEventId
                ] = $newEvent;
                $eventsToCreate[$newEvent->id] = $googleEventId;
            }
        }
    }

    /**
     * Log and determine if the item represents an event instance.
     */
    private function logInstanceIfApplicable(
        User $user,
        string $googleEventId,
        ?string $recurringEventId,
        array|string|null $originalStartTime
    ): bool {
        $isEventInstance =
            !empty($recurringEventId) && !empty($originalStartTime);

        if ($isEventInstance) {
            Log::info(
                'Processing Google Calendar event instance in chunk job',
                [
                    'user_id' => $user->id,
                    'google_event_id' => $googleEventId,
                    'recurring_event_id' => $recurringEventId,
                    'original_start' => $originalStartTime,
                    'chunk_index' => $this->chunkIndex,
                ]
            );
        }

        return $isEventInstance;
    }

    /**
     * Delete cancelled events from our DB.
     * For recurring events, also delete all instances matching the base event ID.
     */
    /**
     * Delete a cancelled event from the DB.
     * - For recurring instances (ID contains '_'), only delete that specific instance
     * - For base events (ID without '_'), delete the base event AND all its instances
     */
    private function deleteCancelledEvent(
        User $user,
        string $googleEventId
    ): void {
        $isRecurringInstance = str_contains($googleEventId, '_');

        // Build query to delete the event
        $query = Event::where('user_id', $user->id);

        if ($isRecurringInstance) {
            // This is a specific recurring instance (e.g., abc123_20260203T123000Z)
            // Only delete this exact instance, not all recurring events
            $query->where('google_event_id', $googleEventId);
        } else {
            // This is a base event (no underscore in ID)
            // Delete the base event AND all its recurring instances
            $query->where(function ($q) use ($googleEventId) {
                $q->where('google_event_id', $googleEventId)->orWhere(
                    'google_event_id',
                    'LIKE',
                    $googleEventId . '_%'
                );
            });
        }

        $deleted = $query->delete();

        Log::info('Cancelled Google event removed from DB in chunk job', [
            'user_id' => $user->id,
            'google_event_id' => $googleEventId,
            'is_recurring_instance' => $isRecurringInstance,
            'deleted_count' => $deleted,
            'chunk_index' => $this->chunkIndex,
        ]);
    }

    /**
     * Get full Google Calendar payload and merge with delta data.
     */
    private function hydrateFullEventPayload(
        User $user,
        string $googleEventId,
        ?string $recurringEventId,
        bool $isEventInstance,
        array $item,
        GoogleCalendarService $calendarEventService
    ): ?array {
        $fullEvent = $calendarEventService->getEventById(
            $googleEventId,
            $user->timezone
        );

        if (!$fullEvent) {
            Log::warning(
                'Skipping event because full Google Calendar payload could not be fetched in chunk job',
                [
                    'user_id' => $user->id,
                    'google_event_id' => $googleEventId,
                    'recurring_event_id' => $recurringEventId,
                    'is_instance' => $isEventInstance,
                    'chunk_index' => $this->chunkIndex,
                ]
            );

            return null;
        }

        return array_merge($item, $fullEvent);
    }

    /**
     * Resolve start/end times for the event in UTC.
     */
    private function resolveEventTimes(
        User $user,
        string $googleEventId,
        ?string $recurringEventId,
        bool $isEventInstance,
        array $item
    ): array {
        $startDateTime =
            $item['start']['dateTime'] ?? ($item['start']['date'] ?? null);
        $endDateTime =
            $item['end']['dateTime'] ?? ($item['end']['date'] ?? null);

        if (!$startDateTime || !$endDateTime) {
            Log::warning('Skipping event without start/end in chunk job', [
                'user_id' => $user->id,
                'google_event_id' => $googleEventId,
                'recurring_event_id' => $recurringEventId,
                'is_instance' => $isEventInstance,
                'chunk_index' => $this->chunkIndex,
            ]);

            return [null, null];
        }

        $eventStartTime = Carbon::parse(
            $startDateTime,
            $user->timezone
        )->timezone('UTC');
        $eventEndTime = Carbon::parse($endDateTime, $user->timezone)->timezone(
            'UTC'
        );

        return [$eventStartTime, $eventEndTime];
    }

    /**
     * Collect event data for batch update instead of immediate update.
     */
    private function collectEventUpdate(
        Event $existing,
        User $user,
        Pulse $pulse,
        array $item,
        \DateTimeInterface $eventStartTime,
        \DateTimeInterface $eventEndTime,
        string $googleEventId,
        ?string $recurringEventId,
        bool $isEventInstance,
        array &$eventsToUpdate
    ): void {
        // Collect the update data for batch processing
        // Include google_event_id to handle ID changes when recurring event time is modified
        $eventsToUpdate[$existing->id] = [
            'name' => $item['summary'] ?? 'Untitled Event',
            'date' => Carbon::instance($eventStartTime)->toDateTimeString(),
            'start_at' => Carbon::instance($eventStartTime)->toDateTimeString(),
            'end_at' => Carbon::instance($eventEndTime)->toDateTimeString(),
            'link' => $this->getGoogleMeetUrl($item),
            'location' => $this->determineEventLocation($item),
            'description' => $item['description'] ?? null,
            'guests' => collect($item['attendees'] ?? [])
                ->pluck('email')
                ->toArray(),
            'google_event_id' => $googleEventId,
        ];

        Log::debug('Collected event update for batch processing', [
            'user_id' => $user->id,
            'pulse_id' => $pulse->id,
            'google_event_id' => $googleEventId,
            'recurring_event_id' => $recurringEventId,
            'is_instance' => $isEventInstance,
            'event_id' => $existing->id,
            'chunk_index' => $this->chunkIndex,
        ]);
    }

    /**
     * Create a new event, link it to a source, owner and create an instance.
     */
    private function createNewEventAndInstance(
        User $user,
        Pulse $pulse,
        array $item,
        \DateTimeInterface $eventStartTime,
        \DateTimeInterface $eventEndTime,
        string $googleEventId,
        ?string $recurringEventId,
        bool $isEventInstance,
        CreateSourcedEventAction $createSourcedEventAction,
        CreateEventOwnerAction $createEventOwnerAction,
        CreateEventInstanceAction $createEventInstanceAction
    ): ?Event {
        $data = \App\DataTransferObjects\ScheduledEventData::from([
            'name' => $item['summary'] ?? 'Untitled Event',
            'date' => $eventStartTime,
            'start_at' => $eventStartTime,
            'end_at' => $eventEndTime,
            'pulse_id' => $pulse->id,
            'organization_id' => $pulse->organization_id,
            'user_id' => $user->id,
            'create_event' => false,
            'link' => $this->getGoogleMeetUrl($item),
            'location' => $this->determineEventLocation($item),
            'description' => $item['description'] ?? null,
            'attendees' => collect($item['attendees'] ?? [])
                ->pluck('email')
                ->toArray(),
            'google_event_id' => $googleEventId,
            'invite_pulse' => false,
            'source_type' => EventSourceType::GOOGLE_CALENDAR,
            'source_id' => $googleEventId,
            'source_data' => [
                'original_calendar_data' => $item,
                'recurring_meeting_id' => $recurringEventId,
                'conference_data' => $item['conferenceData'] ?? null,
                'imported_at' => now()->toISOString(),
                'sync_job' => 'ProcessGoogleCalendarWebhookItemsChunkJob',
            ],
            'sync_with_source' => false,
            'time_zone' => $user->timezone ?? 'UTC',
        ]);

        $event = $createSourcedEventAction->handle(data: $data);

        if (!$event) {
            return null;
        }

        // Link owner
        $createEventOwnerAction->handle(event: $event, eventable: $user);

        // Create an event instance record for this event + pulse
        $eventInstanceData = EventInstanceData::from([
            'event_id' => (string) $event->id,
            'pulse_id' => (string) $pulse->id,
            'local_description' => $item['description'] ?? null,
            'priority' => null,
        ]);

        $createEventInstanceAction->handle(data: $eventInstanceData);

        Log::debug(
            'Created sourced event and event instance from delta in chunk job',
            [
                'user_id' => $user->id,
                'pulse_id' => $pulse->id,
                'google_event_id' => $googleEventId,
                'recurring_event_id' => $recurringEventId,
                'is_instance' => $isEventInstance,
                'event_id' => $event->id,
                'chunk_index' => $this->chunkIndex,
            ]
        );

        return $event;
    }

    /**
     * Determine the appropriate location for an event based on link presence and location data.
     */
    private function determineEventLocation(array $event): string
    {
        $location = $event['location'] ?? null;
        $link = $this->getGoogleMeetUrl($event);

        if (!empty($location)) {
            return $location;
        }

        if (!empty($link)) {
            return 'online';
        }

        return '-';
    }

    /**
     * Check if an event falls within the sync window.
     */
    private function isEventWithinSyncWindow(
        \DateTimeInterface $eventStartTime
    ): bool {
        $eventDate = Carbon::instance($eventStartTime);
        $windowStart = now()
            ->subWeeks(ProcessGoogleCalendarWebhookItemsJob::SYNC_WEEKS_PAST)
            ->startOfDay();
        $windowEnd = now()
            ->addWeeks(ProcessGoogleCalendarWebhookItemsJob::SYNC_WEEKS_FUTURE)
            ->endOfDay();

        return $eventDate->gte($windowStart) && $eventDate->lte($windowEnd);
    }

    /**
     * Extract the date from a recurring event ID.
     */
    private function extractDateFromRecurringEventId(
        string $googleEventId
    ): ?Carbon {
        if (!str_contains($googleEventId, '_')) {
            return null;
        }

        $parts = explode('_', $googleEventId);

        if (count($parts) < 2) {
            return null;
        }

        $timestamp = $parts[1];

        try {
            $timestamp = str_replace('Z', '', $timestamp);

            if (strlen($timestamp) >= 8) {
                $dateStr = substr($timestamp, 0, 8);

                return Carbon::createFromFormat('Ymd', $dateStr);
            }
        } catch (\Exception $e) {
            Log::debug('Failed to parse date from recurring event ID', [
                'google_event_id' => $googleEventId,
                'timestamp' => $timestamp,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }
}
