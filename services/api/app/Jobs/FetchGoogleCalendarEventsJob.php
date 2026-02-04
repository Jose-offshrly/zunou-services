<?php

namespace App\Jobs;

use App\Actions\Event\CreateEventAction;
use App\DataTransferObjects\ScheduledEventData;
use App\Enums\PulseCategory;
use App\Models\Event;
use App\Models\Pulse;
use App\Models\User;
use App\Services\GoogleCalendarService;
use App\Traits\ExtractsGoogleMeetUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class FetchGoogleCalendarEventsJob implements ShouldQueue
{
    use Dispatchable;
    use ExtractsGoogleMeetUrl;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle()
    {
        // Get all users who have Google Calendar refresh tokens
        $users = User::whereNotNull('google_calendar_refresh_token')->get();

        Log::info('Starting Google Calendar events fetch for all users', [
            'total_users' => $users->count(),
        ]);

        foreach ($users as $user) {
            try {
                // Initialize Google Calendar service
                $googleCalendarService = new GoogleCalendarService(
                    $user->google_calendar_refresh_token,
                );

                // Calculate current week Monday to next week Sunday
                $currentWeekStart = Carbon::now()
                    ->startOfWeek(Carbon::MONDAY)
                    ->format('Y-m-d');
                $currentWeekEnd = Carbon::now()
                    ->addWeek()
                    ->endOfWeek(Carbon::SUNDAY)
                    ->format('Y-m-d');

                // Fetch upcoming events for current week through next week
                $events = $googleCalendarService->getUpcomingEvents(
                    fromDate: $currentWeekStart,
                    toDate: $currentWeekEnd,
                    user: $user,
                );

                // Events are already in array format from GoogleCalendarService
                $eventsArray = $events;

                // Collect all Google event IDs from the current sync
                $currentGoogleEventIds = collect($eventsArray)->pluck('id')->filter()->toArray();

                Log::info(
                    'Successfully fetched Google Calendar events for user',
                    [
                        'user_id'      => $user->id,
                        'user_email'   => $user->email,
                        'events_count' => count($eventsArray),
                        'google_event_ids' => $currentGoogleEventIds,
                    ],
                );

                // Get all user's personal pulses from all organizations they are part of
                $personalPulses = Pulse::where(
                    'category',
                    PulseCategory::PERSONAL,
                )
                    ->whereHas('members', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->get();

                if ($personalPulses->isEmpty()) {
                    Log::warning('No personal pulses found for user', [
                        'user_id'    => $user->id,
                        'user_email' => $user->email,
                    ]);

                    continue;
                }

                Log::info('Found personal pulses for user', [
                    'user_id'               => $user->id,
                    'personal_pulses_count' => $personalPulses->count(),
                    'pulse_ids'             => $personalPulses->pluck('id')->toArray(),
                ]);

                foreach ($eventsArray as $event) {
                    Log::info('Google event:', $event);

                    $eventStartTime = Carbon::parse(
                        $event['start']['dateTime'],
                        $user->timezone,
                    )->timezone('UTC');

                    // Create the event in all personal pulses
                    foreach ($personalPulses as $personalPulse) {
                        // Check if event already exists for this specific pulse
                        $existingEvent = Event::where('user_id', $user->id)
                            ->where('pulse_id', $personalPulse->id)
                            ->whereDate('date', $eventStartTime->toDateString())
                            ->where('start_at', $eventStartTime)
                            ->where('google_event_id', $event['id'])
                            ->first();

                        if ($existingEvent) {
                            Log::info('Skipping duplicate event', [
                                'user_id'           => $user->id,
                                'pulse_id'          => $personalPulse->id,
                                'organization_id'   => $personalPulse->organization_id,
                                'event_name'        => $event['summary'],
                                'start_at'          => $eventStartTime->toDateTimeString(),
                                'existing_event_id' => $existingEvent->id,
                                'google_event_id'   => $event['id'],
                            ]);

                            continue;
                        }

                        $data = ScheduledEventData::from([
                            'name'     => $event['summary'],
                            'date'     => $eventStartTime,
                            'start_at' => $eventStartTime,
                            'end_at'   => Carbon::parse(
                                $event['end']['dateTime'],
                                $user->timezone,
                            )->timezone('UTC'),
                            'pulse_id'        => $personalPulse->id,
                            'organization_id' => $personalPulse->organization_id,
                            'user_id'         => $user->id,
                            'create_event'    => false,
                            'link'            => $this->getGoogleMeetUrl($event),
                            'location'        => $this->determineEventLocation($event),
                            'description'     => $event['description'] ?? null,
                            'attendees'       => collect($event['attendees'] ?? [])
                                ->pluck('email')
                                ->toArray(),
                            'google_event_id' => $event['id'],
                            'invite_pulse'    => false, // Default to false for imported events
                        ]);

                        Log::info('Creating event in personal pulse', [
                            'user_id'         => $user->id,
                            'pulse_id'        => $personalPulse->id,
                            'organization_id' => $personalPulse->organization_id,
                            'event_name'      => $event['summary'],
                            'google_event_id' => $event['id'],
                        ]);

                        app(CreateEventAction::class)->handle(data: $data);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to fetch Google Calendar events for user', [
                    'user_id'    => $user->id,
                    'user_email' => $user->email,
                    'error'      => $e->getMessage(),
                ]);

                // Continue with next user instead of stopping the entire job
                continue;
            }
        }

        Log::info('Completed Google Calendar events fetch for all users', [
            'total_users_processed' => $users->count(),
        ]);
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
