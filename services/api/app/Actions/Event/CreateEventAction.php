<?php

declare(strict_types=1);

namespace App\Actions\Event;

use App\Actions\MeetingSession\CreateMeetingSessionAction;
use App\Concerns\CalendarEventHandler;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\DataTransferObjects\ScheduledEventData;
use App\Enums\EventPriority;
use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Enums\PulseCategory;
use App\Helpers\LocationHelper;
use App\Models\Event;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CreateEventAction
{
    use CalendarEventHandler;

    public function __construct(
        private readonly CreateMeetingSessionAction $createMeetingSessionAction,
        private readonly CreateEventOwnerAction $createEventOwnerAction,
    ) {
    }

    public function handle(ScheduledEventData $data): Event
    {
        return DB::transaction(function () use ($data) {
            $link          = null;
            $googleEventId = $data->google_event_id;

            if ($data->create_event) {
                $googleEvent   = $this->createCalendarEvent(data: $data);
                $link          = $googleEvent['link'];
                $googleEventId = $googleEvent['google_event_id'];
            }

            $event = Event::firstOrCreate(
                [
                    'pulse_id'        => $data->pulse_id,
                    'date'            => $data->date,
                    'user_id'         => $data->user_id,
                    'start_at'        => $data->start_at,
                    'google_event_id' => $googleEventId,
                ],
                [
                    'name'            => $data->name,
                    'date'            => $data->date,
                    'link'            => $link ?? $data->link,
                    'start_at'        => $data->start_at,
                    'end_at'          => $data->end_at,
                    'location'        => $data->location,
                    'priority'        => $data->priority ?? EventPriority::MEDIUM->value,
                    'summary'         => $data->summary,
                    'description'     => $data->description,
                    'pulse_id'        => $data->pulse_id,
                    'organization_id' => $data->organization_id,
                    'user_id'         => $data->user_id,
                    'guests'          => $data->attendees,
                    'google_event_id' => $googleEventId,
                ],
            );

            if (isset($data->attendees)) {
                Log::info('attendees:', $data->attendees);
                foreach ($data->attendees as $attendee) {
                    Log::info('attendee:'.$attendee);
                    $user = User::whereEmail($attendee)->first();

                    if ($user) {
                        $event->attendees()->create([
                            'user_id' => $user->id,
                        ]);
                    }
                }
            }

            $pulse = Pulse::find($data->pulse_id);

            if (! $pulse) {
                throw new Error('Pulse not found!');
            }

            // Check if location is online or if invite_pulse is true
            $isLocationOnline = LocationHelper::isLocationOnline(
                $event->location,
            );
            $shouldCreateMeetingSession = $isLocationOnline && $data->invite_pulse && $event->link && $pulse->category === PulseCategory::PERSONAL;

            if ($shouldCreateMeetingSession) {
                Log::alert('EVENT LINK:'.$event->link);
                // Create meeting session for the event if it doesn't already have one
                $this->createMeetingSessionForEvent($event, $data);
                Log::info('Created Meeting session for event: '.$event->id, [
                    'is_location_online' => $isLocationOnline,
                    'invite_pulse'       => $data->invite_pulse,
                    'pulse_category'     => $pulse->category->value,
                ]);
            }

            return $event->fresh([
                'user',
                'pulse',
                'organization',
                'meetingSession',
            ]);
        });
    }

    /**
     * Create a meeting session for the given event
     */
    private function createMeetingSessionForEvent(
        Event $event,
        ScheduledEventData $data,
    ): void {
        try {
            // Check if event already has a meeting session to avoid duplicates
            if ($event->meetingSession()->exists()) {
                Log::info(
                    'Event already has a meeting session, skipping creation',
                    [
                        'event_id' => $event->id,
                    ],
                );

                return;
            }

            // Generate unique meeting ID
            $meetingId = (string) Str::ulid();

            // Determine recurring meeting ID
            $recurringMeetingId = $this->getRecurringMeetingId($event, $data);

            // Create meeting session data from event data
            $meetingSessionData = new MeetingSessionData(
                meeting_id: strtolower($meetingId),
                meeting_url: $event->link,
                type: MeetingSessionType::MEETING->value,
                pulse_id: $data->pulse_id,
                organization_id: $data->organization_id,
                user_id: $data->user_id,
                name: $data->name,
                description: $data->summary,
                start_at: $data->start_at,
                end_at: $data->end_at,
                attendees: $data->attendees,
                external_attendees: null,
                invite_pulse: $data->invite_pulse, // Use the invite_pulse parameter from the event data
                gcal_meeting_id: $data->google_event_id,
                status: MeetingSessionStatus::INACTIVE->value, // Let the action determine the appropriate status
                event_id: $event->id,
                recurring_meeting_id: $recurringMeetingId,
            );

            $user = User::find($data->user_id);

            // Create the meeting session
            $meetingSession = $this->createMeetingSessionAction->handle(
                data: $meetingSessionData,
                fromRecurring: false,
                user: $user,
            );

            Log::info('Successfully created meeting session for event', [
                'event_id'           => $event->id,
                'meeting_session_id' => $meetingSession->id,
                'meeting_id'         => $meetingId,
            ]);
        } catch (\Exception $e) {
            // Log the error but don't break event creation
            Log::error('Failed to create meeting session for event', [
                'event_id' => $event->id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            // Optionally, you could throw the exception if you want event creation to fail
            // when meeting session creation fails. For now, we'll continue gracefully.
        }
    }

    /**
     * Determine the recurring meeting ID based on existing events with same name and Google event ID
     */
    private function getRecurringMeetingId(
        Event $event,
        ScheduledEventData $data,
    ): ?string {
        // Only check for recurring meetings if we have a Google event ID
        if (empty($data->google_event_id)) {
            return null;
        }

        // Check if there are other existing events with the same name and Google event ID
        // This indicates they are part of a recurring calendar event series
        $existingEventsCount = Event::where('name', $data->name)
            ->where('google_event_id', $data->google_event_id)
            ->where('organization_id', $data->organization_id)
            ->where('pulse_id', $data->pulse_id)
            ->where('id', '!=', $event->id) // Exclude the current event
            ->count();

        if ($existingEventsCount > 0) {
            Log::info(
                'Found recurring events with same name and Google event ID',
                [
                    'event_id'              => $event->id,
                    'event_name'            => $data->name,
                    'google_event_id'       => $data->google_event_id,
                    'existing_events_count' => $existingEventsCount,
                ],
            );

            // Use the Google event ID as the recurring meeting ID
            return $data->google_event_id;
        }

        return null;
    }
}
