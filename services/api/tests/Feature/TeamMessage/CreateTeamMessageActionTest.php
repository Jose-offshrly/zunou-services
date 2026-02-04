<?php

namespace Feature\TeamThread;

use App\Actions\TeamMessage\CreateTeamMessageAction;
use App\DataTransferObjects\TeamMessageData;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
use Tests\TestCase;

class CreateTeamMessageActionTest extends TestCase
{
    public function test_it_creates_a_team_message_for_a_given_team_thread()
    {
        $pulse        = Pulse::factory()->create();
        $organization = Organization::first();
        $user         = User::first();
        $teamThread   = TeamThread::factory()->create([
            'pulse_id'        => $pulse->id,
            'organization_id' => $organization->id,
        ]);

        $data = new TeamMessageData(
            team_thread_id: $teamThread->id,
            content: 'Hello, world!',
            user_id: $user->id,
        );

        $action = app(CreateTeamMessageAction::class);

        $teamMessage = $action->handle(data: $data);

        $this->assertInstanceOf(TeamMessage::class, $teamMessage);

        $this->assertDatabaseHas(TeamMessage::class, [
            'team_thread_id' => $data->team_thread_id,
            'content'        => $data->content,
            'user_id'        => $data->user_id,
        ]);
    }
}
