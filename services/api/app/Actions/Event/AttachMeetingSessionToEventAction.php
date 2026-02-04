<?php

declare(strict_types=1);

namespace App\Actions\Event;

use App\Models\Event;
use App\Models\MeetingSession;

final class AttachMeetingSessionToEventAction
{
    public function handle(Event $event, MeetingSession $meeting_session): Event
    {
        // Check if the meeting session is already attached to this event
        if (
            $event
                ->meetingSessions()
                ->where('meeting_session_id', $meeting_session->id)
                ->exists()
        ) {
            throw new \InvalidArgumentException(
                'Meeting session is already attached to this event. Cannot attach the same meeting session twice.',
            );
        }

        // set the current_meeting_session_id
        $event->current_meeting_session_id = $meeting_session->id;
        $event->save();

        $meeting_session->events()->attach($event->id);

        return $event->refresh();
    }
}
