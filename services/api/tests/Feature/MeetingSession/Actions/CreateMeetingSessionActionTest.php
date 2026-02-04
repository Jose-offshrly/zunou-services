<?php

namespace Feature\MeetingSession\Actions;

use App\Actions\MeetingSession\CreateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\MeetingSessionType;
use App\Models\Attendee;
use App\Models\MeetingSession;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreateMeetingSessionActionTest extends TestCase
{
    public function test_it_can_create_a_meeting_session()
    {
        $meeting_id = Str::ulid();
        // Define the fake response
        Http::fake([
            config('zunou.companion.start_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'status'     => 'queued_sqs',
                        'meeting_id' => $meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        $pulse        = Pulse::first();
        $organization = Organization::first();
        $user         = User::first();

        $data = new MeetingSessionData(
            name: 'Zunou Meeting',
            description: 'description',
            start_at: Carbon::now(),
            end_at: Carbon::now()->addHour(),
            attendees: [$user->email],
            meeting_id: $meeting_id,
            meeting_url: 'meeting-url-here',
            type: MeetingSessionType::MEETING->value,
            pulse_id: $pulse->id,
            organization_id: $organization->id,
            user_id: $user->id,
            invite_pulse: true,
        );

        $action = app(CreateMeetingSessionAction::class);

        $meeting_session = $action->handle(data: $data);

        $this->assertInstanceOf(MeetingSession::class, $meeting_session);
        $this->assertEquals('meeting-url-here', $meeting_session->meeting_url);
        $this->assertInstanceOf(Pulse::class, $meeting_session->pulse);
        $this->assertInstanceOf(
            Organization::class,
            $meeting_session->organization,
        );
        $this->assertInstanceOf(User::class, $meeting_session->user);
        $this->assertEquals('Zunou Meeting', $meeting_session->name);
        $this->assertEquals('description', $meeting_session->description);
        $this->assertInstanceOf(Carbon::class, $meeting_session->start_at);
        $this->assertInstanceOf(Carbon::class, $meeting_session->end_at);
        $this->assertContainsOnlyInstancesOf(
            Attendee::class,
            $meeting_session->attendees,
        );
    }
}
