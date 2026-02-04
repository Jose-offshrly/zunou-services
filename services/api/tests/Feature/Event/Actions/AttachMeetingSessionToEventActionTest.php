<?php

declare(strict_types=1);

namespace Tests\Feature\Event\Actions;

use App\Actions\Event\AttachMeetingSessionToEventAction;
use App\Models\Event;
use App\Models\MeetingSession;
use Tests\TestCase;

class AttachMeetingSessionToEventActionTest extends TestCase
{
    public function test_it_can_attach_meeting_sessions_to_a_given_event(): void
    {
        $event           = Event::find(env('TEST_EVENT'));
        $meeting_session = MeetingSession::find(env('TEST_MEETING_SESSION'));

        $action = app(AttachMeetingSessionToEventAction::class);

        $event = $action->handle(
            event: $event,
            meeting_session: $meeting_session,
        );

        $this->assertInstanceOf(Event::class, $event);
        $this->assertEquals($meeting_session->id, $event->current_meeting_session_id);
        $this->assertDatabaseHas('event_meeting_session', [
            'event_id'           => $event->id,
            'meeting_session_id' => $meeting_session->id,
        ]);
    }
}
