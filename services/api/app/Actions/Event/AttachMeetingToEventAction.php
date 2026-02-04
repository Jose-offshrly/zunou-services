<?php

namespace App\Actions\Event;

use App\Models\Event;
use App\Models\Meeting;

class AttachMeetingToEventAction
{
    public function handle(Event $event, Meeting $meeting): Meeting
    {
        $meeting->update(['event_id' => $event->id]);

        return $meeting->fresh();
    }
}
