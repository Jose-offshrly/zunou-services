<?php

namespace App\GraphQL\Mutations;

use App\Actions\Event\AttachMeetingToEventAction;
use App\Models\Event;
use App\Models\Meeting;

class AttachMeetingToEventMutation
{
    public function __construct(
        private AttachMeetingToEventAction $attachMeetingToEventAction,
    ) {
    }

    public function __invoke($_, array $args): Event
    {
        $event   = Event::findOrFail($args['eventId']);
        $meeting = Meeting::findOrFail($args['meetingId']);

        $this->attachMeetingToEventAction->handle($event, $meeting);

        return $event->fresh(['meeting']);
    }
}
