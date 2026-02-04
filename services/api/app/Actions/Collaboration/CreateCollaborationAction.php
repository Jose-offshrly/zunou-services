<?php

declare(strict_types=1);

namespace App\Actions\Collaboration;

use App\Actions\MeetingSession\CreateMeetingSessionAction;
use App\Concerns\CalendarEventHandler;
use App\DataTransferObjects\EventData;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\CollaborationStatus;
use App\Enums\MeetingSessionType;
use App\Enums\MeetingType;
use App\Events\CollabInvite;
use App\Models\Collaboration;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CreateCollaborationAction
{
    use CalendarEventHandler;

    public function __construct(
        private readonly CreateMeetingSessionAction $createMeetingSessionAction,
    ) {
    }

    public function handle(
        EventData $data,
        string $pulse_id,
        string $organization_id,
        string $user_id,
        bool $invite_pulse = false,
    ): Collaboration {
        return DB::transaction(function () use (
            $data,
            $pulse_id,
            $organization_id,
            $user_id,
            $invite_pulse
        ) {
            $meeting_id = (string) Str::ulid();

            // Create calendar event first to get the meeting URL
            $googleEvent = $this->createCalendarEvent(
                data: new MeetingSessionData(
                    meeting_id: $meeting_id,
                    meeting_url: null,
                    type: MeetingSessionType::COLLAB->value,
                    pulse_id: $pulse_id,
                    organization_id: $organization_id,
                    user_id: $user_id,
                    name: $data->name,
                    description: $data->description,
                    start_at: $data->start_at,
                    end_at: $data->end_at,
                    attendees: $data->attendees,
                    external_attendees: $data->external_attendees ?? null,
                    invite_pulse: $invite_pulse,
                    meeting_type: $data->meeting_type,
                ),
            );
            $link = $googleEvent['link'];

            // Create meeting session with the calendar event URL
            $meetingSessionData = new MeetingSessionData(
                meeting_id: $meeting_id,
                meeting_url: $link,
                type: MeetingSessionType::COLLAB->value,
                pulse_id: $pulse_id,
                organization_id: $organization_id,
                user_id: $user_id,
                name: $data->name,
                description: $data->description,
                start_at: $data->start_at,
                end_at: $data->end_at,
                attendees: $data->attendees,
                external_attendees: $data->external_attendees ?? null,
                invite_pulse: $invite_pulse,
                meeting_type: $data->meeting_type,
            );

            $collaboration = Collaboration::create([
                'name'            => $data->name,
                'description'     => $data->description,
                'start_at'        => $data->start_at,
                'end_at'          => $data->end_at,
                'meeting_link'    => $link,
                'status'          => CollaborationStatus::LIVE,
                'pulse_id'        => $pulse_id,
                'organization_id' => $organization_id,
                'user_id'         => $user_id,
            ]);

            $externalAttendees = [];

            foreach ($data->attendees as $attendee) {
                $user = User::whereEmail($attendee)->first();

                if (! $user) {
                    $externalAttendees[] = $attendee;

                    continue;
                }

                $collaboration->attendees()->create([
                    'user_id' => $user->id,
                ]);
            }

            // Optionally return or log the invalid attendees
            if (! empty($externalAttendees)) {
                Log::warning('Some attendees were not found in the system.', [
                    'external_emails' => $externalAttendees,
                ]);
            }

            if ($collaboration) {
                // Pass the meeting URL to avoid creating another calendar event
                $meetingSession = $this->createMeetingSessionAction->handle(
                    data: $meetingSessionData,
                    fromRecurring: false,
                );

                User::whereIn('email', $data->attendees)
                    ->get()
                    ->each(
                        fn ($user) => broadcast(
                            new CollabInvite($meetingSession, $user),
                        ),
                    );
            }

            return $collaboration->refresh();
        });
    }
}
