<?php

namespace App\Jobs;

use App\Actions\Event\CreateEventInstanceAction;
use App\Actions\Event\CreateEventOwnerAction;
use App\Actions\Event\CreateSourcedEventAction;
use App\Contracts\CalendarInterface;
use App\DataTransferObjects\Calendar\EventInstanceData;
use App\DataTransferObjects\ScheduledEventData;
use App\Enums\EventSourceType;
use App\Enums\PulseCategory;
use App\Events\GoogleCalendarSyncCompleted;
use App\Facades\Calendar;
use App\Models\Event;
use App\Models\EventSource;
use App\Models\Pulse;
use App\Models\User;
use App\Services\Calendar\TokenManager;
use App\Traits\ExtractsGoogleMeetUrl;
use App\Traits\ReconciliatesGoogleCalendarEvents;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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
                [$syncToken, $timeMin, $timeMax] = $this->getSyncParameters($user);
                $syncResult                      = $this->fetchEventsFromGoogle(
                    $user,
                    $syncToken,
                    $timeMin,
                    $timeMax,
                );
                $events        = $syncResult['items']         ?? [];
                $nextSyncToken = $syncResult['nextSyncToken'] ?? null;

                // Only update sync token when NOT part of a batch (direct call)
                $this->storeSyncToken($user, $nextSyncToken);
            }

            $pulses = $this->validateAndGetPulses(
                $user,
                $pulseId,
                $organizationId,
            );

            Log::info('Pulses accessed ON SYNC', [
                'user_id'     => $user->id,
                'pulse_ids'   => $pulses->pluck('id')->toArray(),
                'pulse_names' => $pulses->pluck('name')->toArray(),
            ]);

            $eventsByStatus = $this->groupEventsByStatus($events);
            $counts         = $this->processEvents($user, $pulses, $eventsByStatus);

            // Sync events from other pulses when specific pulse is provided
            if ($pulseId) {
                $crossPulseSyncCount = $this->syncEventsFromOtherPulses(
                    $user,
                    $pulses->first(),
                    $timeMin,
                    $timeMax,
                );
                $counts['created'] += $crossPulseSyncCount;
            }

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
        ?string $pulseId,
        string $organizationId,
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

        if ($hasExistingEvents && $this->args['input']['pulseId'] === null) {
            $syncToken = $user->google_calendar_sync_token;
            Log::info('Using sync token for incremental delta sync', [
                'user_id'        => $user->id,
                'has_sync_token' => ! empty($syncToken),
            ]);

            return [$syncToken, null, null];
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

        return [null, $timeMin, $timeMax];
    }

    /**
     * Fetch events from Google Calendar using the sync workflow.
     */
    private function fetchEventsFromGoogle(
        User $user,
        ?string $syncToken,
        ?string $timeMin,
        ?string $timeMax,
    ): array {
        $listParams = [
            'timezone' => $user->timezone ?? 'UTC',
        ];

        if ($syncToken) {
            $listParams['syncToken'] = $syncToken;
        } else {
            $listParams['timeMin'] = $timeMin;
            $listParams['timeMax'] = $timeMax;
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

        foreach ($pulses as $targetPulse) {
            foreach ($activeEvents as $event) {
                try {
                    $result = $this->syncEvent($user, $targetPulse, $event);
                    $counts['created'] += $result['created'];
                    $counts['updated'] += $result['updated'];

                    // Collect newly created events for batch setup
                    if ($result['created'] > 0 && isset($result['syncedEvent'])) {
                        $newlyCreatedEvents[] = [
                            'syncedEvent'    => $result['syncedEvent'],
                            'pulse'          => $targetPulse,
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
        }

        // Batch process newly created events
        if (! empty($newlyCreatedEvents)) {
            $this->batchSetupNewEvents($user, $newlyCreatedEvents);
        }

        return $counts;
    }

    /**
     * Sync a single event (create or update).
     * Returns data for batch processing of newly created events.
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
        $this->handleSingleToRecurringEventConversion($user, $pulse, $googleEventId, $eventStartTime);

        // Use updateOrCreate to handle both create and update in one call
        $syncedEvent = Event::updateOrCreate(
            [
                'user_id'         => $user->id,
                'pulse_id'        => $pulse->id,
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
                    ->toArray(),
                'organization_id' => $pulse->organization_id,
            ],
        );

        $wasNewlyCreated = $syncedEvent->wasRecentlyCreated;

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
     * Batch setup for newly created events to reduce database strain.
     * Processes event sources, owners, and instances in chunks.
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
                    $this->setupNewEvent(
                        $user,
                        $eventData['pulse'],
                        $eventData['event'],
                        $eventData['eventStartTime'],
                        $eventData['eventEndTime'],
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
     * Set up event source, owner, and instance for a newly created event.
     */
    private function setupNewEvent(
        User $user,
        Pulse $pulse,
        array $event,
        Carbon $eventStartTime,
        Carbon $eventEndTime,
    ): void {
        $data = ScheduledEventData::from([
            'name'            => $event['summary'],
            'date'            => $eventStartTime,
            'start_at'        => $eventStartTime,
            'end_at'          => $eventEndTime,
            'pulse_id'        => $pulse->id,
            'organization_id' => $pulse->organization_id,
            'user_id'         => $user->id,
            'create_event'    => false,
            'link'            => $this->getGoogleMeetUrl($event),
            'location'        => $this->determineEventLocation($event),
            'description'     => $event['description'] ?? null,
            'summary'         => $event['description'] ?? null,
            'attendees'       => collect($event['attendees'] ?? [])
                ->pluck('email')
                ->toArray(),
            'google_event_id' => $event['id'],
            'invite_pulse'    => false,
            'source_type'     => EventSourceType::GOOGLE_CALENDAR,
            'source_id'       => $event['id'],
            'source_data'     => [
                'original_calendar_data' => $event,
                'recurring_meeting_id'   => $event['recurring_meeting_id'] ?? null,
                'conference_data'        => $event['conferenceData']       ?? null,
                'imported_at'            => now()->toISOString(),
                'sync_job'               => 'GoogleCalendarEventDeltaSyncJob',
            ],
            'sync_with_source' => false,
            'time_zone'        => $user->timezone ?? 'UTC',
        ]);

        $createdEvent = app(CreateSourcedEventAction::class)->handle(
            data: $data,
        );

        app(CreateEventOwnerAction::class)->handle(
            event: $createdEvent,
            eventable: $user,
        );

        $this->createEventInstance(
            $createdEvent,
            $pulse,
            $event['description'] ?? null,
        );
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
            // Refresh Google Calendar token to ensure we have latest access
            $credentials = $user->google_calendar_credentials;
            TokenManager::refreshGoogleToken($user, $credentials);

            // Reinitialize the service with fresh token
            $this->googleCalendarService = Calendar::make('google', $user);

            // Define time range for fetching events - current month only
            $timeStart = Carbon::now()->startOfMonth();
            $timeEnd   = Carbon::now()->endOfMonth();

            // Fetch only cancelled events from Google Calendar for the current month
            $params = [
                'showDeleted' => true,
                'maxResults'  => 2500,
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
     * Sync events that already exist in event_sources (synced to other pulses)
     * but don't exist in the target pulse yet.
     */
    private function syncEventsFromOtherPulses(
        User $user,
        Pulse $targetPulse,
        ?string $timeMin,
        ?string $timeMax,
    ): int {
        $createdCount = 0;

        // Find event_sources for this user that don't have events in target pulse
        $query = EventSource::where('user_id', $user->id)
            ->where('source', EventSourceType::GOOGLE_CALENDAR)
            ->whereHas('events') // Has events in at least one pulse
            ->whereDoesntHave('events', function ($q) use ($targetPulse) {
                $q->where('pulse_id', $targetPulse->id);
            });

        // Filter by current sync window if provided
        if ($timeMin && $timeMax) {
            $query->whereBetween('date', [$timeMin, $timeMax]);
        }

        $missingEventSources = $query->get();

        foreach ($missingEventSources as $eventSource) {
            try {
                // Get a reference event from another pulse
                $referenceEvent = Event::where(
                    'event_source_id',
                    $eventSource->id,
                )
                    ->where('user_id', $user->id)
                    ->first();

                if (! $referenceEvent) {
                    continue;
                }

                // Use firstOrCreate to prevent duplicates
                $newEvent = Event::firstOrCreate(
                    [
                        'user_id'         => $user->id,
                        'pulse_id'        => $targetPulse->id,
                        'google_event_id' => $referenceEvent->google_event_id,
                    ],
                    [
                        'organization_id' => $targetPulse->organization_id,
                        'event_source_id' => $eventSource->id,
                        'name'            => $referenceEvent->name,
                        'date'            => $referenceEvent->date,
                        'start_at'        => $referenceEvent->start_at,
                        'end_at'          => $referenceEvent->end_at,
                        'link'            => $referenceEvent->link,
                        'location'        => $referenceEvent->location,
                        'description'     => $referenceEvent->description,
                        'summary'         => $referenceEvent->summary,
                        'guests'          => $referenceEvent->guests,
                    ],
                );

                // Only set up event owner and instance if newly created
                if ($newEvent->wasRecentlyCreated) {
                    // Create event owner
                    app(CreateEventOwnerAction::class)->handle($newEvent, $user);

                    // Create event instance
                    $this->createEventInstance($newEvent, $targetPulse, null);

                    $createdCount++;
                }
            } catch (\Exception $e) {
                Log::error('Cross-pulse sync: Failed to sync event', [
                    'user_id'         => $user->id,
                    'target_pulse_id' => $targetPulse->id,
                    'event_source_id' => $eventSource->id,
                    'error'           => $e->getMessage(),
                ]);
            }
        }

        Log::info('Cross-pulse sync completed', [
            'user_id'         => $user->id,
            'target_pulse_id' => $targetPulse->id,
            'created_count'   => $createdCount,
        ]);

        return $createdCount;
    }

    /**
     * Create an event instance and link it to the pulse.
     */
    private function createEventInstance(
        Event $event,
        Pulse $pulse,
        ?string $localDescription = null,
    ): void {
        $eventInstanceData = EventInstanceData::from([
            'event_id'          => (string) $event->id,
            'pulse_id'          => (string) $pulse->id,
            'local_description' => $localDescription,
            'priority'          => null,
        ]);

        app(CreateEventInstanceAction::class)->handle(data: $eventInstanceData);
    }

    /**
     * Handle the edge case where a single event is converted to a recurring event
     *
     * @param  User  $user  The user whose calendar is being synced
     * @param  Pulse  $pulse  The pulse where the event belongs
     * @param  string  $googleEventId  The new recurring event ID (e.g., "abc123_20260121T053000Z")
     * @param  Carbon  $eventStartTime  The start time of the event, used to match events on the same day
     */
    private function handleSingleToRecurringEventConversion(
        User $user,
        Pulse $pulse,
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

        $existingEvent = Event::where('user_id', $user->id)
            ->where('pulse_id', $pulse->id)
            ->where('google_event_id', $baseEventId)
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
                    'pulse_id'            => $pulse->id,
                    'event_id'            => $existingEvent->id,
                    'old_google_event_id' => $baseEventId,
                    'new_google_event_id' => $googleEventId,
                    'event_date'          => $eventStartTime->toDateString(),
                ],
            );
        }
    }

    /**
     * @param  Collection  $pulses
     * @param  User  $user
     * @param  array  $cancelledEventIds
     * @param  bool|null  $deletedCount
     * @return bool|null
     */
    private function getDeleted(Collection $pulses, User $user, array $cancelledEventIds, ?bool $deletedCount): ?bool
    {
        foreach ($pulses as $targetPulse) {
            $existingCancelledEvents = Event::where('user_id', $user->id)
                ->where('pulse_id', $targetPulse->id)
                ->whereIn('google_event_id', $cancelledEventIds)
                ->get();

            if ($existingCancelledEvents->isEmpty()) {
                continue;
            }

            $eventIdsToDelete = $existingCancelledEvents->pluck('id')->toArray();
            $googleEventIds   = $existingCancelledEvents->pluck('google_event_id')->toArray();

            // Bulk delete
            $deleted = Event::whereIn('id', $eventIdsToDelete)->delete();
            $deletedCount += $deleted;

            Log::debug('Bulk deleted cancelled events from pulse', [
                'user_id'          => $user->id,
                'pulse_id'         => $targetPulse->id,
                'deleted_count'    => $deleted,
                'google_event_ids' => $googleEventIds,
            ]);
        }
        return $deletedCount;
    }
}
