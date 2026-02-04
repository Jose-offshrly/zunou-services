<?php

declare(strict_types=1);

namespace App\Actions\Pulse;

use App\DataTransferObjects\Pulse\PulsePipelineData;
use App\Events\StrategiesUpdated;
use App\GraphQL\Mutations\CreateDataSourceMutation;
use App\GraphQL\Mutations\CreatePulseMemberMutation;
use App\GraphQL\Mutations\CreateStrategyMutation;
use App\Models\Pulse;
use Illuminate\Support\Facades\DB;

final class ProvisionPulseAction
{
    public function __construct(
        private Pulse $pulse,
        private readonly CreatePulseAction $createPulseAction,
        private readonly CreateStrategyMutation $createStrategyMutation,
        private readonly CreatePulseMemberMutation $createPulseMemberMutation,
        private readonly CreateDataSourceMutation $createDataSourceMutation,
    ) {
    }

    public function handle(PulsePipelineData $data): Pulse
    {
        return DB::transaction(function () use ($data) {
            $this->pulse = $this->createPulseAction->handle(data: $data->pulse);

            if (isset($data->strategies)) {
                $this->createStrategies($data->strategies);
            }

            if (isset($data->members)) {
                $this->createMembers($data->members);
            }

            if (isset($data->dataSources)) {
                $this->createDataSources($data->dataSources);
            }

            return $this->pulse->refresh();
        });
    }

    private function createStrategies(array $strategies): void
    {
        if (empty($strategies)) {
            return;
        }

        collect($strategies)->each(function ($strategy) {
            $input = array_merge($strategy->all(), [
                'pulseId'        => $this->pulse->id,
                'organizationId' => $this->pulse->organization_id,
            ]);

            $this->createStrategyMutation->create(
                input: $input,
                skipExistsValidation: true,
                skipEvent: true,
            );
        });

        event(new StrategiesUpdated(
            $this->pulse->organization_id,
            $this->pulse->id,
        ));
    }

    private function createMembers(array $members): void
    {
        $formattedMembers = [];

        foreach ($members as $member) {
            $formattedMembers[] = [
                'userId' => $member->userId,
                'role'   => $member->role,
            ];
        }

        // Automatically create pulse member
        $this->createPulseMemberMutation->__invoke(null, [
            'pulseId' => $this->pulse->id,
            'input'   => $formattedMembers,
        ]);
    }

    private function createDataSources(array $dataSources): void
    {
        collect($dataSources)
            ->map(function ($dataSource) {
                return array_merge($dataSource->all(), [
                    'pulse_id' => $this->pulse->id,
                ]);
            })
            ->each(
                fn ($input) => $this->createDataSourceMutation->__invoke(
                    null,
                    $input,
                ),
            );
    }
}
