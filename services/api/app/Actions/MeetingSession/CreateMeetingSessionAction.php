<?php

declare(strict_types=1);

namespace App\Actions\MeetingSession;

use App\Actions\Event\AttachMeetingSessionToEventAction;
use App\Concerns\CalendarEventHandler;
use App\Concerns\CompanionHandler;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\MeetingSessionStatus;
use App\Models\Event;
use App\Models\MeetingSession;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreateMeetingSessionAction
{
    use CalendarEventHandler;
    use CompanionHandler;

    public function handle(
        MeetingSessionData $data,
        bool $fromRecurring = false,
        ?User $user = null,
    ): MeetingSession {
        return DB::transaction(function () use ($data, $fromRecurring, $user) {
            $link = $data->meeting_url;

            // Only create a calendar event if we don't have a meeting URL and it's a COLLAB type
            if (! $link && $data->type === 'COLLAB') {
                $googleEvent = $this->createCalendarEvent(data: $data);
                $link        = $googleEvent['link'];
                // Note: The google_event_id would be stored in gcal_meeting_id field
                // but this action doesn't seem to use it, so we'll just use the link
            }

            if (! $user) {
                $user = Auth::user();
            }

            Log::info('Creating meeting session with status: ' . $data->status);

            $status = $data->status ?? ($data->invite_pulse
                    ? MeetingSessionStatus::ACTIVE
                    : MeetingSessionStatus::INACTIVE);

            $start_at = Carbon::parse(
                $data->start_at,
                $user->timezone,
            )->setTimezone('UTC');
            $end_at = Carbon::parse(
                $data->end_at,
                $user->timezone,
            )->setTimezone('UTC');

            $meeting_session = MeetingSession::create([
                'name'                 => $data->name               ?? null,
                'description'          => $data->description ?? null,
                'start_at'             => $start_at             ?? null,
                'end_at'               => $end_at                 ?? null,
                'type'                 => $data->type               ?? null,
                'meeting_id'           => strtolower($data->meeting_id),
                'meeting_url'          => str_replace(' ', '', $link),
                'pulse_id'             => $data->pulse_id,
                'organization_id'      => $data->organization_id,
                'user_id'              => $data->user_id,
                'invite_pulse'         => $data->invite_pulse,
                'recurring_invite'     => $data->recurring_invite     ?? false,
                'external_attendees'   => $data->external_attendees ?? null,
                'status'               => $status,
                'gcal_meeting_id'      => $data->gcal_meeting_id           ?? null,
                'event_id'             => $data->event_id                         ?? null,
                'event_instance_id'    => $data->event_instance_id                ?? null,
                'recurring_meeting_id' => $data->recurring_meeting_id ?? null,
                'meeting_type'         => $data->meeting_type?->value ?? null,
            ]);

            if (
                $data->invite_pulse && ! $fromRecurring && $meeting_session->status->value === MeetingSessionStatus::ACTIVE->value
            ) {
                $this->startMeetingSession(meetingSession: $meeting_session);
            }

            if (isset($data->attendees)) {
                foreach ($data->attendees as $attendee) {
                    $userAttendee = User::whereEmail($attendee)->first();

                    if ($userAttendee) {
                        $meeting_session->attendees()->create([
                            'user_id' => $userAttendee->id,
                        ]);
                    }
                }
            }

            if (isset($data->event_id)) {
                $event = Event::find($data->event_id);
                app(AttachMeetingSessionToEventAction::class)->handle(
                    event: $event,
                    meeting_session: $meeting_session,
                );
            }

            return $meeting_session->refresh();
        });
    }
}
