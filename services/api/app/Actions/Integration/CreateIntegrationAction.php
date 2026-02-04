<?php

namespace App\Actions\Integration;

use App\DataTransferObjects\IntegrationData;
use App\Enums\SyncStatus;
use App\Models\Integration;

class CreateIntegrationAction
{
    public function handle(IntegrationData $integrationData): Integration
    {
        $integration = Integration::updateOrCreate(
            [
                'user_id'  => $integrationData->user_id,
                'pulse_id' => $integrationData->pulse_id,
                'type'     => $integrationData->type,
            ],
            [
                'api_key'     => $integrationData->api_key,
                'sync_status' => SyncStatus::IN_PROGRESS,
            ],
        );

        \Log::info(
            'CreateIntegrationAction: integration created: ' .
                json_encode($integration->toArray()),
        );

        return $integration->refresh();
    }
}
