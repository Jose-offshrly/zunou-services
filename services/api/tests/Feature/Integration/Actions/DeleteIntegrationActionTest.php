<?php

namespace Feature\Integration\Actions;

use App\Actions\Integration\DeleteIntegrationAction;
use App\Models\DataSource;
use App\Models\Integration;
use App\Models\Meeting;
use Tests\TestCase;

class DeleteIntegrationActionTest extends TestCase
{
    public function test_it_can_delete_a_given_integration()
    {
        Meeting::truncate();

        $integration = Integration::factory()->create();

        Meeting::factory()->create([
            'pulse_id'       => $integration->pulse_id,
            'user_id'        => $integration->user_id,
            'data_source_id' => DataSource::first()->id,
        ]);

        Meeting::factory(4)->create([
            'pulse_id'       => $integration->pulse_id,
            'user_id'        => $integration->user_id,
            'data_source_id' => null,
        ]);
        $this->assertCount(5, Meeting::all());

        $action = app(DeleteIntegrationAction::class);

        $integration = $action->handle($integration);

        $this->assertTrue($integration);
        $this->assertCount(1, Meeting::all());
        $this->assertDatabaseMissing('integrations', [
            'type' => 'test',
        ]);
    }
}
