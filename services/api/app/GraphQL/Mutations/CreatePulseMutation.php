<?php

namespace App\GraphQL\Mutations;

use App\Actions\Pulse\ProvisionPulseAction;
use App\DataTransferObjects\Pulse\PulsePipelineData;
use App\Models\Pulse;
use Exception;
use GraphQL\Error\Error;

class CreatePulseMutation
{
    public function __construct(
        private readonly ProvisionPulseAction $provisionPulseAction,
    ) {
    }

    /**
     * Creates a new Pulse for an organization based on a live MasterPulse.
     *
     * @param  null  $_
     *
     * @throws \Exception
     */
    public function __invoke($_, array $args): Pulse
    {
        try {
            $data = PulsePipelineData::from($args['input']);
            return $this->provisionPulseAction->handle(data: $data);
        } catch (Exception $e) {
            throw new Error('Failed provosioning a pulse ' . $e->getMessage());
        }
    }
}
