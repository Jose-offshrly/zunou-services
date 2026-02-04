<?php

namespace Feature\Integration\Actions;

use App\Actions\Integration\CreateIntegrationAction;
use App\DataTransferObjects\IntegrationData;
use App\Models\Integration;
use Tests\TestCase;

class CreateIntegrationActionTest extends TestCase
{
    public function test_it_can_create_an_integration_resource()
    {
        $data = new IntegrationData(
            user_id: '9d83b6d3-4af7-4945-89a1-9a09c4face84',
            pulse_id: '1e1405d9-4685-47dc-b743-8d3872e390a7',
            type: 'fireflies',
            api_key: 'api-key-here',
        );

        $action = app(CreateIntegrationAction::class);

        $integration = $action->handle(integrationData: $data);

        $this->assertInstanceOf(Integration::class, $integration);
        $this->assertDatabaseHas('integrations', $integration->toArray());
    }
}
