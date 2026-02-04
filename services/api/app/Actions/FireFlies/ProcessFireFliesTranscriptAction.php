<?php

namespace App\Actions\FireFlies;

use App\Actions\Integration\CreateIntegrationAction;
use App\DataTransferObjects\IntegrationData;
use App\Exceptions\FireFliesApiException;
use App\Jobs\ProcessFireFliesMeetingsJob;
use App\Models\Integration;

final readonly class ProcessFireFliesTranscriptAction
{
    public function __construct(
        private CreateIntegrationAction $createIntegrationAction,
    ) {
    }

    /**
     * @throws FireFliesApiException
     */
    public function handle(IntegrationData $integrationData): Integration
    {
        $integration = $this->createIntegrationAction->handle(
            integrationData: $integrationData,
        );

        \Log::info(
            'ProcessFireFliesTranscriptAction: integration initially created: ' .
                json_encode($integration->toArray()),
        );

        // Dispatch the job to the queue
        ProcessFireFliesMeetingsJob::dispatch(
            data: $integrationData,
            user: auth()->user(),
        );

        return $integration;
    }
}
