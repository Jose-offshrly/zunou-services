<?php

namespace Tests\Feature\Collab\Actions;

use App\Actions\Collaboration\CreateCollaborationAction;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\MeetingSessionType;
use App\Models\Attendee;
use App\Models\Collaboration;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreateCollaborationActionTest extends TestCase
{
    public function test_it_can_create_a_meeting_collab(): void
    {
        $meeting_id = Str::ulid();

        $pulse        = Pulse::first();
        $organization = Organization::first();
        $user         = User::first();

        $data = new MeetingSessionData(
            name: 'Zunou Meeting',
            description: 'description',
            start_at: Carbon::now(),
            end_at: Carbon::now()->addHour(),
            attendees: [$user->id],
            meeting_id: $meeting_id,
            meeting_url: 'meeting-url-here',
            type: MeetingSessionType::MEETING->value,
            pulse_id: $pulse->id,
            organization_id: $organization->id,
            user_id: $user->id,
        );

        $action = app(CreateCollaborationAction::class);

        $collab = $action->handle(
            data: $data,
            pulse_id: $pulse->id,
            organization_id: $org->id,
            user_id: $user->id,
        );

        $this->assertInstanceOf(Collaboration::class, $collab);
        $this->assertInstanceOf(Pulse::class, $collab->pulse);
        $this->assertInstanceOf(Organization::class, $collab->organization);
        $this->assertInstanceOf(User::class, $collab->user);
        $this->assertEquals('Zunou Collab', $collab->name);
        $this->assertEquals('zunou dev collab', $collab->description);
        $this->assertNotNull($collab->meeting_link);
        $this->assertInstanceOf(Carbon::class, $collab->start_at);
        $this->assertInstanceOf(Carbon::class, $collab->end_at);
        $this->assertEquals('LIVE', $collab->status->value);
        $this->assertContainsOnlyInstancesOf(
            Attendee::class,
            $collab->attendees,
        );
    }
}
