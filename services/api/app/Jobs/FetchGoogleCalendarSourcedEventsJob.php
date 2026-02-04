<?php

namespace App\Jobs;

use App\Actions\Event\CreateEventOwnerAction;
use App\Actions\Event\CreateSourcedEventAction;
use App\DataTransferObjects\ScheduledEventData;
use App\Enums\EventSourceType;
use App\Enums\PulseCategory;
use App\Facades\Calendar;
use App\Models\Event;
use App\Models\Pulse;
use App\Models\User;
use App\Traits\ExtractsGoogleMeetUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class FetchGoogleCalendarSourcedEventsJob implements ShouldQueue
{
    use Dispatchable;
    use ExtractsGoogleMeetUrl;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(): void
    {
        $users = $this->getUsersWithGoogleCalendarTokens();

        Log::info('Starting Google Calendar events fetch for all users', [
            'total_users' => $users->count(),
        ]);

        foreach ($users as $user) {
            $this->processUserEvents($user);
        }

        Log::info('Completed Google Calendar events fetch for all users', [
            'total_users_processed' => $users->count(),
        ]);
    }

    private function getUsersWithGoogleCalendarTokens(): Collection
    {
        return User::whereNotNull('google_calendar_refresh_token')->get();
    }

    private function processUserEvents(User $user): void
    {
        try {
            $events         = $this->fetchUserEvents($user);
            $personalPulses = $this->getUserPersonalPulses($user);

            if ($personalPulses->isEmpty()) {
                Log::warning('No personal pulses found for user', [
                    'user_id'    => $user->id,
                    'user_email' => $user->email,
                ]);
                return;
            }

            $this->createEventsFromGoogleCalendar($user, $events, $personalPulses);
        } catch (\Exception $e) {
            Log::error('Failed to fetch Google Calendar events for user', [
                'user_id'    => $user->id,
                'user_email' => $user->email,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    private function fetchUserEvents(User $user): array
    {
        $googleCalendarService               = Calendar::make('google', $user);
        [$currentWeekStart, $currentWeekEnd] = $this->getCurrentWeekRange();

        $events = $googleCalendarService->getEvents([
            'fromDate' => $currentWeekStart,
            'toDate'   => $currentWeekEnd,
        ]);

        Log::info('Successfully fetched Google Calendar events for user', [
            'user_id'      => $user->id,
            'user_email'   => $user->email,
            'events_count' => count($events),
        ]);

        return $events;
    }

    private function getUserPersonalPulses(User $user): Collection
    {
        $personalPulses = Pulse::where('category', PulseCategory::PERSONAL)
            ->whereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();

        Log::info('Found personal pulses for user', [
            'user_id'               => $user->id,
            'personal_pulses_count' => $personalPulses->count(),
            'pulse_ids'             => $personalPulses->pluck('id')->toArray(),
        ]);

        return $personalPulses;
    }

    private function createEventsFromGoogleCalendar(User $user, array $events, $personalPulses): void
    {
        foreach ($events as $event) {
            Log::info('Google event:', $event);

            $eventStartTime = Carbon::parse(
                $event['start']['dateTime'],
                $user->timezone,
            )->timezone('UTC');

            foreach ($personalPulses as $personalPulse) {
                $this->createEventInPulse($user, $event, $eventStartTime, $personalPulse);
            }
        }
    }

    private function createEventInPulse(User $user, array $event, Carbon $eventStartTime, Pulse $personalPulse): void
    {
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
            return;
        }

        $data = $this->buildScheduledEventData($user, $event, $eventStartTime, $personalPulse);

        Log::info('Creating event in personal pulse', [
            'user_id'         => $user->id,
            'pulse_id'        => $personalPulse->id,
            'organization_id' => $personalPulse->organization_id,
            'event_name'      => $event['summary'],
            'google_event_id' => $event['id'],
        ]);

        $event = app(CreateSourcedEventAction::class)->handle(data: $data);

        app(CreateEventOwnerAction::class)->handle(event: $event, eventable: $user);
    }

    private function buildScheduledEventData(
        User $user,
        array $event,
        Carbon $eventStartTime,
        Pulse $personalPulse,
    ): ScheduledEventData {
        return ScheduledEventData::from([
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
            'source_type'     => EventSourceType::GOOGLE_CALENDAR,
            'source_id'       => $event['id'],
            'source_data'     => [
                'original_calendar_data' => $event,
                'recurring_meeting_id'   => $event['recurring_meeting_id'] ?? null,
                'conference_data'        => $event['conferenceData']       ?? null,
                'imported_at'            => now()->toISOString(),
                'sync_job'               => 'FetchGoogleCalendarSourcedEventsJob',
            ],
            'sync_with_source' => false,
            'time_zone'        => $user->timezone ?? 'UTC',
        ]);
    }

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

    private function getCurrentWeekRange(): array
    {
        $currentWeekStart = Carbon::now()
            ->startOfWeek(Carbon::MONDAY)
            ->format('Y-m-d');

        $currentWeekEnd = Carbon::now()
            ->addWeek()
            ->endOfWeek(Carbon::SUNDAY)
            ->format('Y-m-d');

        return [$currentWeekStart, $currentWeekEnd];
    }
}
