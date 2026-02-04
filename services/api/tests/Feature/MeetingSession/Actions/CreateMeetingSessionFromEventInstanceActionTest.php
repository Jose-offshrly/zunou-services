<?php

namespace Feature\MeetingSession\Actions;

use App\Actions\MeetingSession\CreateMeetingSessionFromEventInstanceAction;
use App\Models\Event;
use App\Models\EventInstance;
use App\Models\MeetingSession;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Database\Factories\EventFactory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreateMeetingSessionFromEventInstanceActionTest extends TestCase
{
    public function test_it_creates_meeting_session_from_event_instance(): void
    {
        $pulse        = Pulse::factory()->create();
        $organization = Organization::factory()->create();
        $user         = User::factory()->create();

        $event = Event::factory()->create([
            'pulse_id'        => $pulse->id,
            'organization_id' => $organization->id,
            'user_id'         => $user->id,
        ]);

        $eventInstance = EventInstance::create([
            'event_id'          => $event->id,
            'pulse_id'          => $pulse->id,
            'local_description' => 'Local details',
            'priority'          => 'HIGH',
        ]);

        $action = app(CreateMeetingSessionFromEventInstanceAction::class);

        $meetingSession = $action->handle($eventInstance, $user);

        $this->assertInstanceOf(MeetingSession::class, $meetingSession);
        $this->assertEquals($event->id, $meetingSession->event_id);
        $this->assertEquals($eventInstance->id, $meetingSession->event_instance_id);
        $this->assertEquals($event->link, $meetingSession->meeting_url);
        $this->assertEquals($event->name, $meetingSession->name);
        $this->assertEquals($event->summary, $meetingSession->description);
        $this->assertEquals($pulse->id, $meetingSession->pulse_id);
        $this->assertEquals($organization->id, $meetingSession->organization_id);
        $this->assertEquals($user->id, $meetingSession->user_id);
        $this->assertNotEmpty($meetingSession->meeting_id);
    }
}


