<?php

namespace App\Jobs;

use App\Actions\Event\CreateEventAction;
use App\DataTransferObjects\ScheduledEventData;
use App\Enums\PulseCategory;
use App\Events\GoogleCalendarSyncCompleted;
use App\Models\Event;
use App\Models\Pulse;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Traits\ExtractsGoogleMeetUrl;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FetchUserGoogleCalendarEventsJob implements ShouldQueue
{
    use Dispatchable;
    use ExtractsGoogleMeetUrl;
    use Queueable;

    protected GoogleCalendarService $googleCalendarService;

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

            $accessToken  = $user->google_calendar_access_token;
            $refreshToken = $user->google_calendar_refresh_token;

            if (! $accessToken || ! $refreshToken) {
                Log::error('Missing Google Calendar tokens', [
                    'user_id'           => $user->id,
                    'has_access_token'  => ! empty($accessToken),
                    'has_refresh_token' => ! empty($refreshToken),
                ]);
                throw new \Exception(
                    'Google Calendar not connected. Please link your calendar first.',
                );
            }

            Log::info('User calendar events fetch initiated', [
                'user_id'         => $user->id,
                'user_email'      => $user->email,
                'pulse_id'        => $pulseId,
                'organization_id' => $organizationId,
            ]);

            // Initialize Google Calendar service
            $this->googleCalendarService = new GoogleCalendarService(
                $refreshToken,
            );

            // Set the tokens on the Google client
            $this->googleCalendarService->setAccessToken([
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
            ]);

            // If expired, auto-refresh the token
            if ($this->googleCalendarService->isAccessTokenExpired()) {
                Log::info('Access token expired. Refreshing...', [
                    'user_id' => $user->id,
                ]);

                $newToken                           = $this->googleCalendarService->refreshAccessToken();
                $user->google_calendar_access_token = $newToken['access_token'];
                $user->save();

                Log::info('Access token refreshed successfully', [
                    'user_id' => $user->id,
                ]);
            }

            // Use today to 3 months from now as default date range
            $fromDate = Carbon::now()->format('Y-m-d');
            $toDate   = Carbon::now()->addMonths(3)->format('Y-m-d');

            // Fetch events from Google Calendar
            $events = $this->googleCalendarService->getUpcomingEvents(
                fromDate: $fromDate,
                toDate: $toDate,
                user: $user,
                filter: false,
            );

            // Collect all Google event IDs from the current sync
            $currentGoogleEventIds = collect($events)->pluck('id')->filter()->toArray();

            Log::info('Successfully fetched Google Calendar events for user', [
                'user_id'          => $user->id,
                'user_email'       => $user->email,
                'events_count'     => count($events),
                'google_event_ids' => $currentGoogleEventIds,
            ]);

            $syncedEventsCount  = 0;
            $skippedEventsCount = 0;
            $errorEventsCount   = 0;

            // Grab all existing events upfront to avoid querying inside the loop
            $pulseIds = $pulses->pluck('id')->toArray();
            $existingEvents = Event::where('user_id', $user->id)
                ->whereIn('pulse_id', $pulseIds)
                ->whereIn('google_event_id', $currentGoogleEventIds)
                ->get()
                ->groupBy(fn ($event) => $event->pulse_id . ':' . $event->google_event_id);

            // Save or update all fetched events using CreateEventAction
            foreach ($events as $event) {
                try {
                    $eventStartTime = Carbon::parse(
                        $event['start']['dateTime'],
                        $user->timezone,
                    )->timezone('UTC');
                    $eventEndTime = Carbon::parse(
                        $event['end']['dateTime'],
                        $user->timezone,
                    )->timezone('UTC');

                    foreach ($pulses as $targetPulse) {
                        // Check if we already have this event
                        $lookupKey = $targetPulse->id . ':' . $event['id'];
                        $existingEvent = $existingEvents->get($lookupKey)?->first();

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
                                'summary'     => $event['description']     ?? null,
                                'guests'      => collect($event['attendees'] ?? [])
                                    ->pluck('email')
                                    ->toArray(),
                            ]);

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
                                'summary'     => $event['description']     ?? null,
                                'attendees'   => collect(
                                    $event['attendees'] ?? [],
                                )
                                    ->pluck('email')
                                    ->toArray(),
                                'google_event_id' => $event['id'],
                                'invite_pulse'    => false,
                            ]);

                            app(CreateEventAction::class)->handle(data: $data);

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

            Log::info('User calendar events fetch completed', [
                'user_id'              => $user->id,
                'total_events_fetched' => count($events),
                'synced_events'        => $syncedEventsCount,
                'skipped_events'       => $skippedEventsCount,
                'error_events'         => $errorEventsCount,
                'pulses_count'         => $pulses->count(),
                'pulse_ids'            => $pulses->pluck('id')->toArray(),
                'pulse_names'          => $pulses->pluck('name')->toArray(),
                'date_range'           => "{$fromDate} to {$toDate} (current quarter)",
            ]);

            $pulsesMessage = $pulses->count() === 1
                ? "pulse '{$pulses->first()->name}'"
                : "{$pulses->count()} pulses (".
                $pulses->pluck('name')->join(', ').
                ')';

            $result = [
                'success'             => true,
                'message'             => "Successfully fetched and saved {$syncedEventsCount} calendar events to {$pulsesMessage}, deleted {$deletedEventsCount} non-Google events",
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
                'user_id'         => $user->id               ?? null,
                'pulse_id'        => $pulseId               ?? null,
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
}
