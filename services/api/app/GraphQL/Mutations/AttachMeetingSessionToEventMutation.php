<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Event\AttachMeetingSessionToEventAction;
use App\Models\Event;
use App\Models\MeetingSession;
use Exception;
use GraphQL\Error\Error;

readonly class AttachMeetingSessionToEventMutation
{
    public function __invoke($_, array $args): Event
    {
        try {
            $event          = Event::find($args['event_id']);
            $meeting_sesion = MeetingSession::find($args['meeting_session_id']);
            $action         = app(AttachMeetingSessionToEventAction::class);

            return $action->handle(
                event: $event,
                meeting_session: $meeting_sesion,
            );
        } catch (Exception $e) {
            throw new Error($e->getMessage());
        }
    }
}
