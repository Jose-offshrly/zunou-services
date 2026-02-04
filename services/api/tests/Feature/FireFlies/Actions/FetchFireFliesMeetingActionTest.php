<?php

namespace Feature\FireFlies\Actions;

use App\Actions\FireFlies\StoreUserFireFliesNewMeetingAction;
use App\Models\User;
use Tests\TestCase;

class FetchFireFliesMeetingActionTest extends TestCase
{
    public function test_it_can_fetch_fireflies_meeting_record()
    {
        $user      = User::first();
        $meetingId = '01JNFAMQKBT6H7EW9ST29Q32TN';
        $action    = app(StoreUserFireFliesNewMeetingAction::class);

        $action->handle(user: $user, meetingId: $meetingId);

        $this->assertDatabaseHas('meetings', [
            'meeting_id' => $meetingId,
        ]);
    }
}
