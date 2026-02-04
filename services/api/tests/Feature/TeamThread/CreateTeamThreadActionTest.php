<?php

namespace Feature\TeamThread;

use App\Actions\TeamThread\CreateTeamThreadAction;
use App\DataTransferObjects\TeamThreadData;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\TeamThread;
use Tests\TestCase;

class CreateTeamThreadActionTest extends TestCase
{
    public function test_it_creates_a_team_thread_for_a_given_pulse_and_organization()
    {
        $pulse        = Pulse::factory()->create();
        $organization = Organization::first();

        $data = new TeamThreadData(
            pulse_id: $pulse->id,
            organization_id: $organization->id,
        );

        $action = app(CreateTeamThreadAction::class);

        $teamThread = $action->handle(data: $data);

        $this->assertInstanceOf(TeamThread::class, $teamThread);

        $this->assertDatabaseHas(TeamThread::class, [
            'pulse_id'        => $data->pulse_id,
            'organization_id' => $data->organization_id,
        ]);
    }
}
