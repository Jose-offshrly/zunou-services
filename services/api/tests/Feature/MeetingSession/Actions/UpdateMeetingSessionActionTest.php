<?php

namespace Feature\MeetingSession\Actions;

use App\Actions\MeetingSession\UpdateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\UpdateMeetingSessionData;
use App\Enums\MeetingSessionStatus;
use App\Models\MeetingSession;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class UpdateMeetingSessionActionTest extends TestCase
{
    public function test_it_can_update_a_meeting_session_resource_to_ended()
    {
        $meet = MeetingSession::first();
        // Define the fake response
        Http::fake([
            config('zunou.companion.stop_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'meeting_id' => $meet->meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        $data = new UpdateMeetingSessionData(
            status: MeetingSessionStatus::ENDED->value,
        );

        $action = app(UpdateMeetingSessionAction::class);

        $meetingSession = $action->handle(meetingSession: $meet, data: $data);

        $this->assertInstanceOf(MeetingSession::class, $meetingSession);
        $this->assertEquals('ENDED', $meetingSession->status->value);
        $this->assertDatabaseHas('meetings', [
            'source' => 'companion',
        ]);
    }

    public function test_it_can_update_a_meeting_session_resource_to_paused()
    {
        $meet = MeetingSession::first();
        // Define the fake response
        Http::fake([
            config('zunou.companion.pause_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'meeting_id' => $meet->meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        $data = new UpdateMeetingSessionData(
            status: MeetingSessionStatus::PAUSED->value,
        );

        $action = app(UpdateMeetingSessionAction::class);

        $meetingSession = $action->handle(meetingSession: $meet, data: $data);

        $this->assertEquals('PAUSED', $meetingSession->status->value);
    }

    public function test_it_can_update_a_meeting_session_resource_to_active()
    {
        $meet = MeetingSession::first();
        // Define the fake response
        Http::fake([
            config('zunou.companion.resume_meeting_url') => Http::response(
                [
                    'code' => 200,
                    'body' => [
                        'meeting_id' => $meet->meeting_id,
                    ],
                ],
                200,
            ),
        ]);

        $data = new UpdateMeetingSessionData(
            status: MeetingSessionStatus::ACTIVE->value,
        );

        $action = app(UpdateMeetingSessionAction::class);

        $meetingSession = $action->handle(meetingSession: $meet, data: $data);

        $this->assertEquals('ACTIVE', $meetingSession->status->value);
    }
}
