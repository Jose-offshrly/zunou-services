<?php

namespace App\Jobs;

use App\Actions\Event\CreateEventInstanceAction;
use App\Actions\Event\CreateEventOwnerAction;
use App\Contracts\CalendarInterface;
use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Enums\EventSourceType;
use App\Enums\PulseCategory;
use App\Events\GoogleCalendarSyncCompleted;
use App\Facades\Calendar;
use App\Models\Attendee;
use App\Models\Event;
use App\Models\EventInstance;
use App\Models\EventOwner;
use App\Models\EventSource;
use App\Models\Pulse;
use App\Models\RecurringEvent;
use App\Models\User;
use App\Traits\ExtractsGoogleMeetUrl;
use App\Traits\ReconciliatesGoogleCalendarEvents;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GoogleCalendarEventDeltaSyncJob implements ShouldQueue
{
    use Dispatchable;
    use ExtractsGoogleMeetUrl;
    use Queueable;
    use ReconciliatesGoogleCalendarEvents;

    protected CalendarInterface $googleCalendarService;

    public function __construct(
        public readonly User $user,
        public readonly array $args,
    ) {
        $this->onQueue('high');
    }

    /**
     * Execute the job.
     * Handles delta sync of Google Calendar events using sync tokens.
     * Processes create, update, and delete operations based on event status.
     */
    public function handle(): void
    {
        try {
            $user = $this->user;
            if (! $user) {
                throw new \Exception('User not authenticated');
            }

            $args             = $this->args;
            $pulseId          = $args['input']['pulseId']          ?? null;
            $organizationId   = $args['input']['organizationId']   ?? null;
            $prefetchedEvents = $args['input']['prefetchedEvents'] ?? null;
            $timeMin          = $args['input']['timeMin']          ?? null;
            $timeMax          = $args['input']['timeMax']          ?? null;

            Log::info('PULSE SINGLE:'. $pulseId);

            if (! $organizationId) {
                throw new \Exception('Organization ID is required');
            }

            $this->googleCalendarService = Calendar::make('google', $user);

            Log::info('Google Calendar delta sync initiated', [
                'user_id'                 => $user->id,
                'user_email'              => $user->email,
                'pulse_id'                => $pulseId,
                'organization_id'         => $organizationId,
                'using_prefetched_events' => $prefetchedEvents !== null,
            ]);

            // Use prefetched events if available (from orchestrator), otherwise fetch directly
            if ($prefetchedEvents !== null) {
                $events        = $prefetchedEvents;
                $syncToken     = null;
                $nextSyncToken = null;
            } else {
                [$syncToken,$showDeleted, $timeMin, $timeMax] = $this->getSyncParameters($user);
                $syncResult                                   = $this->fetchEventsFromGoogle(
                    $user,
                    $syncToken,
                    $showDeleted,
                    $timeMin,
                    $timeMax,
                );

                Log::info('Fetched events from Google Calendar', [
                    'user_id'             => $user->id,
                    'total_events'        => count($syncResult['items'] ?? []),
                    'has_next_sync_token' => isset($syncResult['nextSyncToken']),
                    'next_sync_token'     => $syncResult['nextSyncToken'] ?? null,
                    'events'              => collect($syncResult['items'] ?? [])->map(fn ($event) => [
                        'id'      => $event['id']                ?? null,
                        'summary' => $event['summary']           ?? 'No Title',
                        'status'  => $event['status']            ?? null,
                        'start'   => $event['start']['dateTime'] ?? $event['start']['date'] ?? null,
                    ])->toArray(),
                ]);

                $events        = $syncResult['items']         ?? [];
                $nextSyncToken = $syncResult['nextSyncToken'] ?? null;

                // Only update sync token when NOT part of a batch (direct call)
                $this->storeSyncToken($user, $nextSyncToken);
            }

            $pulses = $this->validateAndGetPulses(
                $user,
                $organizationId,
            );

            Log::info('Pulses accessed ON SYNC', [
                'user_id'     => $user->id,
                'pulse_ids'   => $pulses->pluck('id')->toArray(),
                'pulse_names' => $pulses->pluck('name')->toArray(),
            ]);

            $eventsByStatus = $this->groupEventsByStatus($events);
            $counts         = $this->processEvents($user, $pulses, $eventsByStatus);

            // Reconcile current month events: delete events from DB that no longer exist on Google Calendar
            $reconciledCount = $this->reconcileCurrentMonthEvents($user, $pulses);
            $counts['deleted'] += $reconciledCount;

            $this->logSyncResults(
                $user,
                $pulses,
                $counts,
                $events,
                $syncToken,
                $nextSyncToken,
                $timeMin,
                $timeMax,
                $organizationId,
            );
        } catch (\Exception $e) {
            Log::error('Failed to perform Google Calendar delta sync', [
                'user_id'         => $this->user->id                        ?? null,
                'pulse_id'        => $this->args['input']['pulseId']        ?? null,
                'organization_id' => $this->args['input']['organizationId'] ?? null,
                'error'           => $e->getMessage(),
                'trace'           => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Validate input and get pulses for the sync operation.
     */
    private function validateAndGetPulses(
        User $user,
        string $organizationId,
        ?string $pulseId = null,
    ): Collection {
        $pulses = collect();

        if ($pulseId) {
            $pulse = Pulse::find($pulseId);
            if (! $pulse) {
                throw new \Exception('Pulse not found');
            }

            if ($pulse->organization_id !== $organizationId) {
                throw new \Exception(
                    'Pulse does not belong to the specified organization',
                );
            }

            $pulses->push($pulse);

            Log::info('Using specified pulse for calendar delta sync', [
                'user_id'         => $user->id,
                'pulse_id'        => $pulse->id,
                'pulse_name'      => $pulse->name,
                'organization_id' => $pulse->organization_id,
            ]);
        } else {
            $personalPulses = Pulse::where('category', PulseCategory::PERSONAL)
                ->where('organization_id', $organizationId)
                ->whereHas('members', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->get();

            if ($personalPulses->isEmpty()) {
                throw new \Exception(
                    'No personal pulses found for the specified organization. Please create a personal pulse first.',
                );
            }

            $pulses = $personalPulses;

            Log::info(
                'Using personal pulses from organization for calendar delta sync',
                [
                    'user_id'               => $user->id,
                    'organization_id'       => $organizationId,
                    'total_personal_pulses' => $personalPulses->count(),
                    'pulse_ids'             => $pulses->pluck('id')->toArray(),
                ],
            );
        }

        return $pulses;
    }

    /**
     * Determine sync parameters (sync token or time range).
     */
    private function getSyncParameters(User $user): array
    {
        $hasExistingEvents = Event::where('user_id', $user->id)
            ->whereNotNull('google_event_id')
            ->exists();

        if ($hasExistingEvents && ($this->args['input']['pulseId'] ?? null) === null) {
            $syncToken = $user->google_calendar_sync_token;
            Log::info('Using sync token for incremental delta sync', [
                'user_id'        => $user->id,
                'has_sync_token' => ! empty($syncToken),
            ]);

            return [$syncToken,false, null, null];
        }

        $timeMin = Carbon::now()->format('Y-m-d');
        $timeMax = Carbon::now()->addMonths(3)->format('Y-m-d');

        Log::info(
            'No existing events found, performing full sync for 3 months',
            [
                'user_id'  => $user->id,
                'time_min' => $timeMin,
                'time_max' => $timeMax,
            ],
        );

        return [null,false, $timeMin, $timeMax];
    }

    /**
     * Fetch events from Google Calendar using the sync workflow.
     */
    private function fetchEventsFromGoogle(
        User $user,
        ?string $syncToken,
        ?bool $showDeleted,
        ?string $timeMin,
        ?string $timeMax,
    ): array {
        $listParams = [
            'timezone' => $user->timezone ?? 'UTC',
        ];

        if ($syncToken) {
            $listParams['syncToken'] = $syncToken;
        } else {
            $listParams['showDeleted'] = $showDeleted;
            $listParams['timeMin']     = $timeMin;
            $listParams['timeMax']     = $timeMax;
        }

        return $this->googleCalendarService->listEvents($listParams);
    }

    /**
     * Store sync token to users table.
     */
    private function storeSyncToken(User $user, ?string $nextSyncToken): void
    {
        if ($nextSyncToken) {
            $user->update(['google_calendar_sync_token' => $nextSyncToken]);
            Log::info('Stored sync token to users table', [
                'user_id' => $user->id,
            ]);
        }
    }

    /**
     * Group events by their status.
     */
    private function groupEventsByStatus(array $events): Collection
    {
        $eventsByStatus = collect($events)->groupBy(function ($event) {
            return $event['status'] ?? 'confirmed';
        });

        Log::info('Grouped events by status', [
            'user_id'       => $this->user->id,
            'status_counts' => $eventsByStatus
                ->map(fn ($group) => $group->count())
                ->toArray(),
        ]);

        return $eventsByStatus;
    }

    /**
     * Process all events grouped by status.
     */
    private function processEvents(
        User $user,
        Collection $pulses,
        Collection $eventsByStatus,
    ): array {
        Log::info('Processing Events', [
            'user_id'      => $user->id,
            'pulses_count' => $pulses->count(),
            'events_count' => $eventsByStatus
                ->map(fn ($group) => $group->count())
                ->toArray(),
            'pulses_ids' => $pulses->pluck('id')->toArray(),
        ]);
        $counts = [
            'created' => 0,
            'updated' => 0,
            'deleted' => 0,
            'skipped' => 0,
            'error'   => 0,
        ];

        // Process cancelled events first (DELETE operations)
        if ($eventsByStatus->has('cancelled')) {
            $counts['deleted'] = $this->processCancelledEvents(
                $user,
                $pulses,
                $eventsByStatus->get('cancelled'),
            );
        }

        // Process confirmed and other active status events (CREATE/UPDATE operations)
        $activeStatuses = ['confirmed', 'tentative'];
        foreach ($activeStatuses as $status) {
            if (! $eventsByStatus->has($status)) {
                continue;
            }

            $result = $this->processActiveEvents(
                $user,
                $pulses,
                $eventsByStatus->get($status),
                $status,
            );

            $counts['created'] += $result['created'];
            $counts['updated'] += $result['updated'];
            $counts['error']   += $result['error'];
        }

        Log::info('Completed processing events', [
            'user_id' => $user->id,
            'counts'  => $counts,
        ]);

        return $counts;
    }

    /**
     * Process cancelled events (DELETE operations).
     */
    private function processCancelledEvents(
        User $user,
        Collection $pulses,
        Collection $cancelledEvents,
    ): int {
        $cancelledEventIds = $cancelledEvents->pluck('id')->toArray();
        $deletedCount      = 0;

        Log::info('Processing cancelled events', [
            'user_id' => $user->id,
            'count'   => count($cancelledEventIds),
        ]);

        $deletedCount = $this->getDeleted($pulses, $user, $cancelledEventIds, $deletedCount);

        return $deletedCount;
    }

    /**
     * Process active events (CREATE/UPDATE operations).
     * Events are unique per org — we sync the event once using the first pulse,
     * then ensure EventOwner entries exist for all pulses.
     */
    private function processActiveEvents(
        User $user,
        Collection $pulses,
        Collection $activeEvents,
        string $status,
    ): array {
        Log::info('Processing Active Events');
        $counts = ['created' => 0, 'updated' => 0, 'error' => 0];

        Log::info("Processing {$status} events", [
            'user_id'   => $user->id,
            'pulse_ids' => $pulses->pluck('id')->toArray(),
            'count'     => $activeEvents->count(),
        ]);

        // Collect newly created events for batch processing
        $newlyCreatedEvents = [];
        $primaryPulse       = $pulses->first();

        foreach ($activeEvents as $event) {
            try {
                // Sync the event once using the primary pulse for org context
                $result = $this->syncEvent($user, $primaryPulse, $event);
                $counts['created'] += $result['created'];
                $counts['updated'] += $result['updated'];

                // Ensure EventOwner entries exist for all remaining pulses
                if (isset($result['syncedEvent'])) {
                    foreach ($pulses->skip(1) as $additionalPulse) {
                        $this->ensureEventOwner($result['syncedEvent'], $additionalPulse);
                        $this->ensureEventInstance($result['syncedEvent'], $additionalPulse, $event);
                    }
                } else {
                    // For updated events, resolve the synced event to add owners
                    $googleEventId = $event['id'];
                    $syncedEvent   = Event::where('organization_id', $primaryPulse->organization_id)
                        ->where('google_event_id', $googleEventId)
                        ->first();

                    if ($syncedEvent) {
                        foreach ($pulses->skip(1) as $additionalPulse) {
                            $this->ensureEventOwner($syncedEvent, $additionalPulse);
                            $this->ensureEventInstance($syncedEvent, $additionalPulse, $event);
                        }
                    }
                }

                // Collect newly created events for batch setup
                if ($result['created'] > 0 && isset($result['syncedEvent'])) {
                    $newlyCreatedEvents[] = [
                        'syncedEvent'    => $result['syncedEvent'],
                        'pulse'          => $primaryPulse,
                        'event'          => $event,
                        'eventStartTime' => $result['eventStartTime'],
                        'eventEndTime'   => $result['eventEndTime'],
                    ];
                }
            } catch (\Exception $e) {
                Log::error(
                    'Failed to process event from Google Calendar delta sync',
                    [
                        'user_id'         => $user->id,
                        'event_summary'   => $event['summary'] ?? 'Unknown',
                        'google_event_id' => $event['id']      ?? null,
                        'error'           => $e->getMessage(),
                    ],
                );
                $counts['error']++;
            }
        }

        // Batch process newly created events
        if (! empty($newlyCreatedEvents)) {
            $this->batchSetupNewEvents($user, $newlyCreatedEvents);
        }

        return $counts;
    }

    /**
     * Sync a single event (create or update).
     * Events are unique per (user_id, organization_id, google_event_id).
     * Multiple pulses are linked via EventOwner entries.
     */
    private function syncEvent(User $user, Pulse $pulse, array $event): array
    {
        $eventStartTime = Carbon::parse(
            $event['start']['dateTime'],
            $user->timezone,
        )->timezone('UTC');
        $eventEndTime = Carbon::parse(
            $event['end']['dateTime'],
            $user->timezone,
        )->timezone('UTC');

        $googleEventId = $event['id'];

        // Handle edge case: if a single event was updated to a recurring event,
        // the google_event_id changes from "abc123" to "abc123_20260121T053000Z".
        // We need to update the existing event's google_event_id to prevent duplicates.
        $this->handleSingleToRecurringEventConversion($user, $googleEventId, $eventStartTime);

        // Use updateOrCreate with org-level uniqueness (one event per google_event_id per org)
        $syncedEvent = Event::updateOrCreate(
            [
                'organization_id' => $pulse->organization_id,
                'google_event_id' => $googleEventId,
            ],
            [
                'name'        => $event['summary'],
                'date'        => $eventStartTime,
                'start_at'    => $eventStartTime,
                'end_at'      => $eventEndTime,
                'link'        => $this->getGoogleMeetUrl($event),
                'location'    => $this->determineEventLocation($event),
                'description' => $event['description'] ?? null,
                'summary'     => $event['description'] ?? null,
                'guests'      => collect($event['attendees'] ?? [])
                    ->pluck('email')
                    ->when(
                        $event['organizer']['email'] ?? null,
                        fn ($collection, $organizerEmail) => $collection->contains(
                            fn ($email) => strtolower(trim($email)) === strtolower(trim($organizerEmail))
                        )
                            ? $collection
                            : $collection->prepend($organizerEmail)
                    )
                    ->toArray(),
                'organization_id'    => $pulse->organization_id,
                'google_cal_organizer' => $event['organizer']['email'] ?? null,
            ],
        );

        $wasNewlyCreated = $syncedEvent->wasRecentlyCreated;

        // Handle recurring event creation
        $this->handleRecurringEvent($syncedEvent, $event);

        // Ensure the pulse has EventOwner and EventInstance entries for this event
        $this->ensureEventOwner($syncedEvent, $pulse);
        $this->ensureEventInstance($syncedEvent, $pulse, $event);

        // Sync attendees (entity_type relationship) for the event
        // Refresh to pick up recurring_event_id set by handleRecurringEvent
        $syncedEvent->refresh();
        $this->syncEventAttendees($syncedEvent, $event);

        if ($wasNewlyCreated) {
            $this->logEventCreated($user, $pulse, $event);

            // Return data for batch processing instead of processing immediately
            return [
                'created'        => 1,
                'updated'        => 0,
                'syncedEvent'    => $syncedEvent,
                'eventStartTime' => $eventStartTime,
                'eventEndTime'   => $eventEndTime,
            ];
        }

        $this->updateEventSource($syncedEvent, $event, $eventStartTime);
        $this->logEventUpdated($user, $pulse, $event, $syncedEvent);

        return ['created' => 0, 'updated' => 1];
    }

    /**
     * Handle recurring event creation if the event is part of a recurring series.
     */
    private function handleRecurringEvent(Event $event, array $googleEventData): void
    {
        // Check if this event is part of a recurring series
        $recurringEventId = $googleEventData['recurringEventId'] ?? $googleEventData['recurring_meeting_id'] ?? null;

        Log::info('Checking recurring event', [
            'event_id'           => $event->id,
            'event_name'         => $event->name,
            'recurring_event_id' => $recurringEventId,
            'google_event_id'    => $googleEventData['id'] ?? null,
        ]);

        if (empty($recurringEventId)) {
            // Not a recurring event, clear any existing recurring_event_id
            if ($event->recurring_event_id) {
                $event->update(['recurring_event_id' => null]);
            }
            return;
        }

        // Atomically get or create the series row. firstOrCreate still does a SELECT
        // then INSERT under the hood, so two concurrent jobs can race. Catch any
        // unique-constraint violation (SQLSTATE 23000) and re-fetch the winner's row
        // so we can always link the event below — no silent orphan is possible.
        try {
            $recurringEvent = RecurringEvent::firstOrCreate(
                ['google_parent_id' => $recurringEventId]
            );
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() !== '23000') {
                throw $e;
            }
            // Another job won the race — fetch the row it created.
            $recurringEvent = RecurringEvent::where('google_parent_id', $recurringEventId)->firstOrFail();
        }

        // Link the current event (guards against a stale in-memory value when the
        // event was updated rather than freshly created).
        if ($event->recurring_event_id !== $recurringEvent->id) {
            $event->update(['recurring_event_id' => $recurringEvent->id]);
        }

        // Bulk-link every other instance of this series already in the DB that
        // hasn't been linked yet (e.g. synced before the RecurringEvent row existed).
        Event::where('google_event_id', 'like', $recurringEventId . '_%')
            ->whereNull('recurring_event_id')
            ->update(['recurring_event_id' => $recurringEvent->id]);

        Log::info('Linked recurring event series', [
            'event_id'           => $event->id,
            'recurring_event_id' => $recurringEvent->id,
            'google_parent_id'   => $recurringEvent->google_parent_id,
            'was_created'        => $recurringEvent->wasRecentlyCreated,
        ]);
    }

    /**
     * Batch setup for newly created events to reduce database strain.
     * Sets up event sources, owners, and instances for events already created by syncEvent.
     */
    private function batchSetupNewEvents(User $user, array $newlyCreatedEvents): void
    {
        if (empty($newlyCreatedEvents)) {
            return;
        }

        Log::info('Batch processing newly created events', [
            'user_id' => $user->id,
            'count'   => count($newlyCreatedEvents),
        ]);

        // Process in chunks to avoid memory issues with large batches
        $chunks = array_chunk($newlyCreatedEvents, 50);

        foreach ($chunks as $chunk) {
            foreach ($chunk as $eventData) {
                try {
                    $this->setupNewEventSource(
                        $user,
                        $eventData['syncedEvent'],
                        $eventData['event'],
                        $eventData['eventStartTime'],
                    );
                } catch (\Exception $e) {
                    Log::error('Failed to setup new event in batch', [
                        'user_id'         => $user->id,
                        'event_id'        => $eventData['syncedEvent']->id ?? null,
                        'google_event_id' => $eventData['event']['id']     ?? null,
                        'error'           => $e->getMessage(),
                    ]);
                }
            }
        }

        Log::info('Completed batch processing of newly created events', [
            'user_id' => $user->id,
            'count'   => count($newlyCreatedEvents),
        ]);
    }

    /**
     * Set up event source for a newly created event.
     * The event is already created by syncEvent; EventOwner and EventInstance
     * are already handled via ensureEventOwner/ensureEventInstance.
     */
    private function setupNewEventSource(
        User $user,
        Event $syncedEvent,
        array $event,
        Carbon $eventStartTime,
    ): void {
        $eventSource = EventSource::updateOrCreate(
            [
                'source_id' => $event['id'],
                'user_id'   => $user->id,
                'source'    => EventSourceType::GOOGLE_CALENDAR,
            ],
            [
                'source'    => EventSourceType::GOOGLE_CALENDAR,
                'source_id' => $event['id'],
                'user_id'   => (string) $user->id,
                'date'      => $eventStartTime,
                'data'      => [
                    'name'                   => $event['summary'],
                    'location'               => $this->determineEventLocation($event),
                    'attendees'              => collect($event['attendees'] ?? [])->pluck('email')->toArray(),
                    'description'            => $event['description'] ?? null,
                    'summary'                => $event['description'] ?? null,
                    'timezone'               => $user->timezone ?? 'UTC',
                    'sync_enabled'           => false,
                    'original_calendar_data' => $event,
                    'recurring_meeting_id'   => $event['recurring_meeting_id'] ?? null,
                    'conference_data'        => $event['conferenceData']       ?? null,
                    'imported_at'            => now()->toISOString(),
                    'sync_job'               => 'GoogleCalendarEventDeltaSyncJob',
                ],
            ],
        );

        $syncedEvent->update(['event_source_id' => $eventSource->id]);
    }

    /**
     * Update event source for existing events.
     */
    private function updateEventSource(
        Event $syncedEvent,
        array $event,
        Carbon $eventStartTime,
    ): void {
        if ($syncedEvent->eventSource) {
            $syncedEvent->eventSource->update([
                'date' => $eventStartTime,
                'data' => array_merge($syncedEvent->eventSource->data ?? [], [
                    'name'      => $event['summary'],
                    'location'  => $this->determineEventLocation($event),
                    'attendees' => collect($event['attendees'] ?? [])
                        ->pluck('email')
                        ->toArray(),
                    'description'            => $event['description'] ?? null,
                    'last_synced_at'         => now()->toISOString(),
                    'original_calendar_data' => $event,
                ]),
            ]);
        }
    }

    /**
     * @param  User  $user
     * @param  Collection  $pulses
     * @return int
     */
    private function reconcileCurrentMonthEvents(
        User $user,
        Collection $pulses,
    ): int {
        $deletedCount = 0;

        try {
            // Reinitialize the service with fresh token
            $this->googleCalendarService = Calendar::make('google', $user);

            // Define time range for fetching events - current month only
            $timeStart  = Carbon::now()->startOfMonth();
            $timeEnd    = Carbon::now()->addMonths(3);
            $updatedMin = Carbon::now()->startOfMonth();

            // Fetch only cancelled events from Google Calendar for the current month
            $params = [
                'showDeleted' => true,
                'maxResults'  => 2500,
                'updatedMin'  => $updatedMin->format('Y-m-d'),
                'timeMin'     => $timeStart->format('Y-m-d'),
                'timeMax'     => $timeEnd->format('Y-m-d'),
            ];

            $results = $this->googleCalendarService->listEvents($params);

            // Filter to only cancelled events
            $cancelledEvents = collect($results['items'] ?? [])
                ->filter(fn ($event) => ($event['status'] ?? '') === 'cancelled');

            Log::info('Cancelled events filtered from Google Calendar response', [
                'user_id'                => $user->id,
                'total_events_fetched'   => count($results['items'] ?? []),
                'cancelled_events_count' => $cancelledEvents->count(),
                'cancelled_events'       => $cancelledEvents->map(fn ($event) => [
                    'id'      => $event['id']                ?? null,
                    'summary' => $event['summary']           ?? 'No Title',
                    'status'  => $event['status']            ?? null,
                    'start'   => $event['start']['dateTime'] ?? $event['start']['date'] ?? null,
                    'end'     => $event['end']['dateTime']   ?? $event['end']['date'] ?? null,
                ])->values()->toArray(),
            ]);

            $cancelledEventIds = $cancelledEvents
                ->pluck('id')
                ->toArray();

            // Skip if no cancelled events
            if (empty($cancelledEventIds)) {
                Log::info('No cancelled events to reconcile', [
                    'user_id' => $user->id,
                ]);

                return $deletedCount;
            }

            $deletedCount = $this->getDeleted($pulses, $user, $cancelledEventIds, $deletedCount);

            Log::info('Completed orphaned events reconciliation', [
                'user_id'       => $user->id,
                'deleted_count' => $deletedCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to reconcile orphaned events', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
        }

        return $deletedCount;
    }

    /**
     * Log sync results and dispatch completion event.
     */
    private function logSyncResults(
        User $user,
        Collection $pulses,
        array $counts,
        array $events,
        ?string $syncToken,
        ?string $nextSyncToken,
        ?string $timeMin,
        ?string $timeMax,
        string $organizationId,
    ): void {
        Log::info('Google Calendar delta sync completed', [
            'user_id'              => $user->id,
            'total_events_fetched' => count($events),
            'created_events'       => $counts['created'],
            'updated_events'       => $counts['updated'],
            'deleted_events'       => $counts['deleted'],
            'skipped_events'       => $counts['skipped'],
            'error_events'         => $counts['error'],
            'pulses_count'         => $pulses->count(),
            'pulse_ids'            => $pulses->pluck('id')->toArray(),
            'pulse_names'          => $pulses->pluck('name')->toArray(),
            'date_range'           => $timeMin && $timeMax
                    ? "{$timeMin} to {$timeMax}"
                    : 'sync token sync',
            'sync_token_used'        => ! empty($syncToken),
            'next_sync_token_stored' => ! empty($nextSyncToken),
        ]);

        $pulsesMessage = $pulses->count() === 1
                ? "pulse '{$pulses->first()->name}'"
                : "{$pulses->count()} pulses (".
                    $pulses->pluck('name')->join(', ').
                    ')';

        $result = [
            'success'             => true,
            'message'             => "Successfully synced calendar events: {$counts['created']} created, {$counts['updated']} updated, {$counts['deleted']} deleted in {$pulsesMessage}",
            'totalEventsFetched'  => count($events),
            'createdEventsCount'  => $counts['created'],
            'updatedEventsCount'  => $counts['updated'],
            'deletedEventsCount'  => $counts['deleted'],
            'skippedEventsCount'  => $counts['skipped'],
            'errorEventsCount'    => $counts['error'],
            'personalPulsesCount' => $pulses->count(),
        ];

        Log::info('Delta sync result', $result);

        event(
            new GoogleCalendarSyncCompleted(
                user: $user,
                syncResult: $result,
                organizationId: $organizationId,
            ),
        );
    }

    /**
     * Log event creation.
     */
    private function logEventCreated(
        User $user,
        Pulse $pulse,
        array $event,
    ): void {
        Log::debug('Created event in pulse', [
            'user_id'         => $user->id,
            'pulse_id'        => $pulse->id,
            'pulse_name'      => $pulse->name,
            'organization_id' => $pulse->organization_id,
            'event_name'      => $event['summary'],
            'google_event_id' => $event['id'],
        ]);
    }

    /**
     * Log event update.
     */
    private function logEventUpdated(
        User $user,
        Pulse $pulse,
        array $event,
        Event $syncedEvent,
    ): void {
        Log::debug('Updated existing event from Google Calendar in pulse', [
            'user_id'         => $user->id,
            'pulse_id'        => $pulse->id,
            'pulse_name'      => $pulse->name,
            'organization_id' => $pulse->organization_id,
            'event_name'      => $event['summary'],
            'google_event_id' => $event['id'],
            'event_id'        => $syncedEvent->id,
        ]);
    }

    /**
     * Determine the appropriate location for an event based on link presence and location data.
     */
    private function determineEventLocation(array $event): string
    {
        $location = $event['location'] ?? null;
        $link     = $this->getGoogleMeetUrl($event);

        if (! empty($location)) {
            return $location;
        }

        if (! empty($link)) {
            return 'online';
        }

        return '-';
    }

    /**
     * Ensure an EventOwner entry exists linking the event to the given pulse.
     * Prevents duplicate ownership entries.
     */
    private function ensureEventOwner(Event $event, Pulse $pulse): void
    {
        $exists = EventOwner::where('event_id', $event->id)
            ->where('entity_type', Pulse::class)
            ->where('entity_id', $pulse->id)
            ->exists();

        if (! $exists) {
            app(CreateEventOwnerAction::class)->handle(
                event: $event,
                eventable: $pulse,
            );
        }
    }

    /**
     * Ensure an EventInstance entry exists linking the event to the given pulse.
     * Prevents duplicate instance entries.
     * For personal pulses, only creates the instance if the user is a participant of the event.
     */
    private function ensureEventInstance(Event $event, Pulse $pulse, ?array $googleEventData = null): void
    {
        // For personal pulses, skip event instance creation if the user is not a participant
        if ($pulse->category === PulseCategory::PERSONAL) {
            if (! $this->isUserEventParticipant($this->user, $event, $googleEventData)) {
                Log::debug('Skipping event instance for personal pulse — user is not a participant', [
                    'user_id'         => $this->user->id,
                    'user_email'      => $this->user->email,
                    'event_id'        => $event->id,
                    'pulse_id'        => $pulse->id,
                    'event_name'      => $event->name ?? $googleEventData['summary'] ?? null,
                ]);

                return;
            }
        }

        $isRecurring = ! empty($googleEventData['recurring_meeting_id']);
        Log::debug('Ensuring event instance for pulse', [
            'user_id'         => $this->user->id,
            'event_id'        => $event->id,
            'pulse_id'        => $pulse->id,
            'is_recurring'    => $isRecurring,
            'event_name'      => $event->name ?? $googleEventData['summary'] ?? null,
        ]);

        $existing = EventInstance::where('event_id', $event->id)
            ->where('pulse_id', $pulse->id)
            ->first();

        if (! $existing) {
            $this->createEventInstance($event, $pulse, isRecurring: $isRecurring);
        } elseif ($existing->is_recurring !== $isRecurring) {
            $existing->update(['is_recurring' => $isRecurring]);
        }
    }

    /**
     * Create an event instance and link it to the pulse.
     */
    private function createEventInstance(
        Event $event,
        Pulse $pulse,
        ?string $localDescription = null,
        bool $isRecurring = false,
    ): void {
        $eventInstanceData = EventInstanceData::from([
            'event_id'          => (string) $event->id,
            'pulse_id'          => (string) $pulse->id,
            'local_description' => $localDescription,
            'priority'          => null,
            'is_recurring'      => $isRecurring,
        ]);

        app(CreateEventInstanceAction::class)->handle(data: $eventInstanceData);
    }

    /**
     * Sync attendees (entity_type relationship) for the event.
     * Links users in the system who match attendee emails to the event via the attendees relationship.
     * Uses sync approach: removes attendees no longer in the list and adds new ones.
     */
    private function syncEventAttendees(Event $event, array $googleEventData): void
    {
        $attendeeEmails = $this->collectAttendeeEmails($googleEventData);

        if (empty($attendeeEmails)) {
            return;
        }

        $placeholders  = collect($attendeeEmails)->map(fn () => '?')->implode(',');
        $usersInSystem = User::whereRaw("LOWER(email) IN ({$placeholders})", $attendeeEmails)->get();

        if ($usersInSystem->isEmpty()) {
            return;
        }

        // Get all current attendees (both morph-based and recurring_event_id-based)
        $currentAttendeeUserIds = $event->getAllAttendees()->pluck('user_id')->toArray();
        $newAttendeeUserIds     = $usersInSystem->pluck('id')->toArray();

        $usersToAdd    = array_diff($newAttendeeUserIds, $currentAttendeeUserIds);
        $usersToRemove = array_diff($currentAttendeeUserIds, $newAttendeeUserIds);

        // Wrap in transaction to ensure atomicity of delete + insert operations
        DB::transaction(function () use ($event, $usersToRemove, $usersToAdd) {
            // Remove attendees no longer in the list from BOTH relationships
            if (! empty($usersToRemove)) {
                $event->attendees()->whereIn('user_id', $usersToRemove)->forceDelete();
                if ($event->recurring_event_id) {
                    $event->recurringEventAttendees()->whereIn('user_id', $usersToRemove)->forceDelete();
                }
            }

            foreach ($usersToAdd as $userId) {
                $this->upsertAttendee($event, $userId);
            }
        });

        if (! empty($usersToAdd) || ! empty($usersToRemove)) {
            Log::debug('Synced event attendees', [
                'event_id'      => $event->id,
                'added_count'   => count($usersToAdd),
                'removed_count' => count($usersToRemove),
            ]);
        }
    }

    /**
     * Collect and normalise all attendee emails from Google event data,
     * including organizer and creator (creator and organizer can differ).
     */
    private function collectAttendeeEmails(array $googleEventData): array
    {
        $emails = collect($googleEventData['attendees'] ?? [])->pluck('email');

        foreach (['organizer', 'creator'] as $role) {
            $email = $googleEventData[$role]['email'] ?? null;
            if ($email) {
                $emails->push($email);
            }
        }

        return $emails
            ->map(fn ($e) => strtolower(trim($e)))
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Create or update an attendee record for the given user on the event.
     * For recurring events, keys on user + series to ensure a single record
     * across all instances. Migrates existing morph-based attendees to use
     * recurring_event_id when the event becomes part of a recurring series.
     *
     * Invariant: Every attendee must have either (entity_type + entity_id) OR
     * recurring_event_id set — never both NULL. This is enforced by Attendee model.
     */
    private function upsertAttendee(Event $event, string $userId): void
    {
        if ($event->recurring_event_id) {
            // Check if attendee already exists for this recurring series
            $existingRecurringAttendee = Attendee::where('user_id', $userId)
                ->where('recurring_event_id', $event->recurring_event_id)
                ->first();

            if ($existingRecurringAttendee) {
                return;
            }

            // Check for existing morph-based attendee for THIS event that needs migration
            $existingMorphAttendee = Attendee::where('user_id', $userId)
                ->where('entity_type', Event::class)
                ->where('entity_id', $event->id)
                ->whereNull('recurring_event_id')
                ->first();

            if ($existingMorphAttendee) {
                $existingMorphAttendee->update([
                    'recurring_event_id' => $event->recurring_event_id,
                    'entity_type'        => null,
                    'entity_id'          => null,
                ]);

                return;
            }

            // Create new attendee for recurring series
            Attendee::create([
                'user_id'            => $userId,
                'recurring_event_id' => $event->recurring_event_id,
                'entity_type'        => null,
                'entity_id'          => null,
            ]);

            return;
        }

        // Non-recurring event: check if morph-based attendee already exists for this event
        $existingMorphAttendee = Attendee::where('user_id', $userId)
            ->where('entity_type', Event::class)
            ->where('entity_id', $event->id)
            ->first();

        if ($existingMorphAttendee) {
            return;
        }

        // Create new morph-based attendee
        Attendee::create([
            'user_id'     => $userId,
            'entity_type' => Event::class,
            'entity_id'   => $event->id,
        ]);
    }

    /**
     * Check if the user is a participant (attendee, organizer, or creator) of the event.
     * Uses Google event data if available, otherwise falls back to the stored Event model data.
     */
    private function isUserEventParticipant(User $user, Event $event, ?array $googleEventData = null): bool
    {
        $userEmail = strtolower(trim($user->email));

        if ($googleEventData) {
            // Check organizer
            $organizer = $googleEventData['organizer']['email'] ?? null;
            if ($organizer && strtolower(trim($organizer)) === $userEmail) {
                return true;
            }

            // Check creator
            $creator = $googleEventData['creator']['email'] ?? null;
            if ($creator && strtolower(trim($creator)) === $userEmail) {
                return true;
            }

            // Check attendees
            $attendees = collect($googleEventData['attendees'] ?? [])
                ->pluck('email')
                ->map(fn ($email) => strtolower(trim($email)));

            if ($attendees->contains($userEmail)) {
                return true;
            }

            return false;
        }

        // Fallback: use stored Event model data
        $organizer = $event->getRawOriginal('google_cal_organizer') ?? null;
        if ($organizer && strtolower(trim($organizer)) === $userEmail) {
            return true;
        }

        // Check guests stored in the event (raw JSON: plain email strings or objects)
        $rawGuests = $event->getRawOriginal('guests') ?? null;
        if ($rawGuests) {
            $guests = is_string($rawGuests) ? (json_decode($rawGuests, true) ?? []) : $rawGuests;
            $guestEmails = collect($guests)->map(function ($guest) {
                if (is_array($guest)) {
                    // Prefer 'email' key if present; fall back to 'name' which
                    // currently holds the email address in the legacy format
                    // produced by getGuestsAttribute().
                    $value = $guest['email'] ?? $guest['name'] ?? '';

                    return strtolower(trim($value));
                }

                return strtolower(trim((string) $guest));
            });

            if ($guestEmails->contains($userEmail)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Handle the edge case where a single event is converted to a recurring event.
     * Looks up by org-level uniqueness since events are unique per (user_id, organization_id, google_event_id).
     *
     * @param  User  $user  The user whose calendar is being synced
     * @param  string  $googleEventId  The new recurring event ID (e.g., "abc123_20260121T053000Z")
     * @param  Carbon  $eventStartTime  The start time of the event, used to match events on the same day
     */
    private function handleSingleToRecurringEventConversion(
        User $user,
        string $googleEventId,
        Carbon $eventStartTime,
    ): void {
        // Only process if this is a recurring event (has underscore with timestamp)
        if (! str_contains($googleEventId, '_')) {
            return;
        }

        // Extract the base event ID (without timestamp)
        $baseEventId = $this->extractBaseEventId($googleEventId);

        // Check if there's an existing event with the base ID
        $dayStart = $eventStartTime->copy()->startOfDay();
        $dayEnd   = $eventStartTime->copy()->addDay()->startOfDay();

        $existingEvent = Event::where('google_event_id', $baseEventId)
            ->whereBetween('start_at', [$dayStart, $dayEnd])
            ->first();

        // Verify the event is on the same day and update
        if ($existingEvent) {
            // Update the google_event_id to the new recurring event ID
            $existingEvent->update(['google_event_id' => $googleEventId]);

            Log::info(
                'Updated single event google_event_id to recurring event format',
                [
                    'user_id'             => $user->id,
                    'event_id'            => $existingEvent->id,
                    'old_google_event_id' => $baseEventId,
                    'new_google_event_id' => $googleEventId,
                    'event_date'          => $eventStartTime->toDateString(),
                ],
            );
        }
    }

    /**
     * Delete cancelled events by org-level uniqueness (user_id + organization_id + google_event_id).
     * EventOwner entries are cascade-deleted via the foreign key on event_owners.event_id.
     *
     * @param  Collection  $pulses
     * @param  User  $user
     * @param  array  $cancelledEventIds
     * @param  int  $deletedCount
     * @return int
     */
    private function getDeleted(Collection $pulses, User $user, array $cancelledEventIds, int $deletedCount): int
    {
        $organizationId = $pulses->first()?->organization_id;

        if (! $organizationId) {
            return $deletedCount;
        }

        $existingCancelledEvents = Event::where('organization_id', $organizationId)
            ->whereIn('google_event_id', $cancelledEventIds)
            ->get();

        if ($existingCancelledEvents->isEmpty()) {
            return $deletedCount;
        }

        $eventIdsToDelete = $existingCancelledEvents->pluck('id')->toArray();
        $googleEventIds   = $existingCancelledEvents->pluck('google_event_id')->toArray();

        // Bulk delete (EventOwner entries cascade via FK)
        $deleted = Event::whereIn('id', $eventIdsToDelete)->delete();
        $deletedCount += $deleted;

        Log::debug('Bulk deleted cancelled events from organization', [
            'user_id'          => $user->id,
            'organization_id'  => $organizationId,
            'deleted_count'    => $deleted,
            'google_event_ids' => $googleEventIds,
        ]);

        return $deletedCount;
    }
}
