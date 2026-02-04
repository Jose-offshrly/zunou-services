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
use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Models\User;
use App\Traits\ExtractsGoogleMeetUrl;
use App\Traits\ReconciliatesGoogleCalendarEvents;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FetchUserGoogleCalendarSourcedEventsJob implements ShouldQueue
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
     */
    public function handle(): void
    {
        $deletedEventsCount = 0;
        $args               = $this->args;

        try {
            /** @var User $user */
            $user = $this->user;
            if (! $user) {
                throw new \Exception('User not authenticated');
            }

            // Extract input parameters - organization_id is now required
            $pulseId        = $args['input']['pulseId']        ?? null;
            $organizationId = $args['input']['organizationId'] ?? null;

            // Validate that organization_id is always provided
            if (! $organizationId) {
                throw new \Exception('Organization ID is required');
            }

            $pulse  = null;
            $pulses = collect();

            if ($pulseId) {
                // Single pulse mode - validate the provided pulse
                $pulse = Pulse::find($pulseId);
                if (! $pulse) {
                    throw new \Exception('Pulse not found');
                }

                // Verify the pulse belongs to the specified organization
                if ($pulse->organization_id !== $organizationId) {
                    throw new \Exception(
                        'Pulse does not belong to the specified organization',
                    );
                }

                $pulses->push($pulse);

                Log::info('Using specified pulse for calendar events', [
                    'user_id'         => $user->id,
                    'pulse_id'        => $pulse->id,
                    'pulse_name'      => $pulse->name,
                    'organization_id' => $pulse->organization_id,
                ]);
            } else {
                // Organization personal pulses mode - get personal pulses for the specified organization
                $personalPulses = Pulse::where(
                    'category',
                    PulseCategory::PERSONAL,
                )
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

                // Add all personal pulses from the organization to the collection
                foreach ($personalPulses as $personalPulse) {
                    $pulses->push($personalPulse);
                }

                if ($pulses->isEmpty()) {
                    throw new \Exception(
                        'No personal pulses available for calendar events in the specified organization',
                    );
                }

                Log::info(
                    'Using personal pulses from organization for calendar events',
                    [
                        'user_id'               => $user->id,
                        'organization_id'       => $organizationId,
                        'total_personal_pulses' => $personalPulses->count(),
                        'pulse_ids'             => $pulses->pluck('id')->toArray(),
                    ],
                );
            }

            Log::info('User calendar events fetch initiated', [
                'user_id'         => $user->id,
                'user_email'      => $user->email,
                'pulse_id'        => $pulseId,
                'organization_id' => $organizationId,
            ]);

            // Initialize Google Calendar service
            $this->googleCalendarService = Calendar::make('google', $user);

            // Use today to 3 months from now as default date range
            $fromDate = Carbon::now()->format('Y-m-d');
            $toDate   = Carbon::now()->addMonths(3)->format('Y-m-d');

            // Fetch events from Google Calendar
            $events = $this->googleCalendarService->getEvents([
                'fromDate' => $fromDate,
                'toDate'   => $toDate,
            ]);

            $events = $this->filterEvents(events: $events, user_id: $user->id);

            $syncedEventsCount  = 0;
            $skippedEventsCount = 0;
            $errorEventsCount   = 0;

            foreach ($events as $event) {
                Log::info('EVENT:', $event);
                try {
                    $eventStartTime = Carbon::parse(
                        $event['start']['dateTime'],
                        'UTC',
                    )->utc();
                    $eventEndTime = Carbon::parse(
                        $event['end']['dateTime'],
                        'UTC',
                    )->utc();

                    // Create the event in all authorized pulses
                    foreach ($pulses as $targetPulse) {
                        // Check if event already exists for this specific pulse by google_event_id
                        $existingEvent = Event::where('user_id', $user->id)
                            ->where('pulse_id', $targetPulse->id)
                            ->where('google_event_id', $event['id'])
                            ->first();

                        if ($existingEvent) {
                            // Update existing event to reflect changes from Google Calendar
                            $existingEvent->update([
                                'name'     => $event['summary'],
                                'date'     => $eventStartTime,
                                'start_at' => $eventStartTime,
                                'end_at'   => $eventEndTime,
                                'link'     => $this->getGoogleMeetUrl($event),
                                'location' => $this->determineEventLocation(
                                    $event,
                                ),
                                'description' => $event['description'] ?? null,
                                'summary'     => $event['description'] ?? null,
                                'guests'      => collect($event['attendees'] ?? [])
                                    ->pluck('email')
                                    ->toArray(),
                            ]);

                            // Update associated event source if it exists
                            if ($existingEvent->eventSource) {
                                $existingEvent->eventSource->update([
                                    'date' => $eventStartTime,
                                    'data' => array_merge(
                                        $existingEvent->eventSource->data ?? [],
                                        [
                                            'name'     => $event['summary'],
                                            'location' => $this->determineEventLocation(
                                                $event,
                                            ),
                                            'attendees' => collect(
                                                $event['attendees'] ?? [],
                                            )
                                                ->pluck('email')
                                                ->toArray(),
                                            'description'            => $event['description'] ?? null,
                                            'last_synced_at'         => now()->toISOString(),
                                            'original_calendar_data' => $event,
                                        ],
                                    ),
                                ]);
                            }

                            $syncedEventsCount++;

                            Log::debug(
                                'Updated existing event from Google Calendar in pulse',
                                [
                                    'user_id'         => $user->id,
                                    'pulse_id'        => $targetPulse->id,
                                    'pulse_name'      => $targetPulse->name,
                                    'organization_id' => $targetPulse->organization_id,
                                    'event_name'      => $event['summary'],
                                    'google_event_id' => $event['id'],
                                    'event_id'        => $existingEvent->id,
                                ],
                            );
                        } else {
                            // Create new event if it does not exist
                            $data = ScheduledEventData::from([
                                'name'            => $event['summary'],
                                'date'            => $eventStartTime,
                                'start_at'        => $eventStartTime,
                                'end_at'          => $eventEndTime,
                                'pulse_id'        => $targetPulse->id,
                                'organization_id' => $targetPulse->organization_id,
                                'user_id'         => $user->id,
                                'create_event'    => false,
                                'link'            => $this->getGoogleMeetUrl($event),
                                'location'        => $this->determineEventLocation(
                                    $event,
                                ),
                                'description' => $event['description'] ?? null,
                                'summary'     => $event['description'] ?? null,
                                'attendees'   => collect(
                                    $event['attendees'] ?? [],
                                )
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
                                    'sync_job'               => 'FetchUserGoogleCalendarSourcedEventsJob',
                                ],
                                'sync_with_source' => false,
                                'time_zone'        => $user->timezone ?? 'UTC',
                            ]);

                            $event = app(
                                CreateSourcedEventAction::class,
                            )->handle(data: $data);

                            app(CreateEventOwnerAction::class)->handle(
                                event: $event,
                                eventable: $user,
                            );

                            $this->createEventInstance(
                                $event,
                                $targetPulse,
                                $event['description'] ?? null,
                            );

                            $syncedEventsCount++;

                            Log::debug('Created event in pulse', [
                                'user_id'         => $user->id,
                                'pulse_id'        => $targetPulse->id,
                                'pulse_name'      => $targetPulse->name,
                                'organization_id' => $targetPulse->organization_id,
                                'event_name'      => $event['summary'],
                                'google_event_id' => $event['id'],
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    Log::error(
                        'Failed to create event from Google Calendar data',
                        [
                            'user_id'       => $user->id,
                            'event_summary' => $event['summary'] ?? 'Unknown',
                            'error'         => $e->getMessage(),
                        ],
                    );
                    $errorEventsCount++;
                }
            }

            // Reconcile orphaned events - delete events in DB that no longer exist on Google Calendar
            $windowStart        = Carbon::parse($fromDate)->startOfDay();
            $windowEnd          = Carbon::parse($toDate)->endOfDay();
            $deletedEventsCount = $this->reconcileOrphanedEvents(
                user: $user,
                calendarEventService: $this->googleCalendarService,
                windowStart: $windowStart,
                windowEnd: $windowEnd,
                pulseIds: $pulses->pluck('id')->toArray(), // Only reconcile for synced pulses
                logContext: [
                    'sync_type'  => 'manual',
                    'date_range' => "{$fromDate} to {$toDate}",
                ],
            );

            Log::info('User calendar events fetch completed', [
                'user_id'              => $user->id,
                'total_events_fetched' => count($events),
                'synced_events'        => $syncedEventsCount,
                'skipped_events'       => $skippedEventsCount,
                'error_events'         => $errorEventsCount,
                'deleted_events'       => $deletedEventsCount,
                'pulses_count'         => $pulses->count(),
                'pulse_ids'            => $pulses->pluck('id')->toArray(),
                'pulse_names'          => $pulses->pluck('name')->toArray(),
                'date_range'           => "{$fromDate} to {$toDate} (current quarter)",
            ]);

            $pulsesMessage = $pulses->count() === 1
                    ? "pulse '{$pulses->first()->name}'"
                    : "{$pulses->count()} pulses (" .
                        $pulses->pluck('name')->join(', ') .
                        ')';

            $result = [
                'success'             => true,
                'message'             => "Successfully fetched and saved {$syncedEventsCount} calendar events to {$pulsesMessage}, deleted {$deletedEventsCount} orphaned events",
                'totalEventsFetched'  => count($events),
                'syncedEventsCount'   => $syncedEventsCount,
                'skippedEventsCount'  => $skippedEventsCount,
                'errorEventsCount'    => $errorEventsCount,
                'deletedEventsCount'  => $deletedEventsCount,
                'personalPulsesCount' => $pulses->count(),
            ];

            Log::info('Events', $result);

            // Dispatch the calendar sync completed event
            event(
                new GoogleCalendarSyncCompleted(
                    user: $user,
                    syncResult: $result,
                    organizationId: $organizationId,
                ),
            );
        } catch (\Exception $e) {
            Log::error('Failed to fetch user calendar events', [
                'user_id'         => $user->id       ?? null,
                'pulse_id'        => $pulseId        ?? null,
                'organization_id' => $organizationId ?? null,
                'error'           => $e->getMessage(),
                'trace'           => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Determine the appropriate location for an event based on link presence and location data.
     */
    private function determineEventLocation(array $event): string
    {
        $location = $event['location'] ?? null;
        $link     = $this->getGoogleMeetUrl($event);

        // If event has location, return it
        if (! empty($location)) {
            return $location;
        }

        // If event has no location but has a link, return "online"
        if (! empty($link)) {
            return 'online';
        }

        // If event has neither location nor link, return "-"
        return '-';
    }

    private function filterEvents(array $events, string $user_id): array
    {
        // Get already imported event IDs from the database
        $importedEventIds = MeetingSession::whereNotNull('gcal_meeting_id')
            ->where('user_id', $user_id)
            ->pluck('gcal_meeting_id')
            ->toArray();

        // Filter out already imported events
        $events = array_filter($events, function ($event) use (
            $importedEventIds
        ) {
            return ! in_array($event['id'], $importedEventIds);
        });

        \Log::info('Filtered upcoming events', [
            'total_events' => count($events),
            'imported_ids' => count($importedEventIds),
        ]);

        return $events;
    }

    /**
     * Create an event instance for the given event and pulse.
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
}
