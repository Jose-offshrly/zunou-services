<?php

namespace App\GraphQL\Mutations;

use App\Events\StrategiesUpdated;
use App\Models\Automation;
use App\Models\Strategy;
use App\Services\StrategyService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CreateStrategyMutation
{
    /**
     * Creates a new Strategy for the Pulse.
     *
     * @param null $_
     * @param array $args
     * @return Strategy
     * @throws \Exception
     */
    public function __invoke($_, array $args): Strategy
    {
        return $this->create($args['input']);
    }

    public function create(array $input, bool $skipExistsValidation = false, bool $skipEvent = false): Strategy
    {
        try {
            $this->validateInput($input, $skipExistsValidation);

            $strategy = $this->createStrategy($input, $skipEvent);

            return $strategy;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a pulse strategy: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input, bool $skipExistsValidation = false): void
    {
        $rules = [
            'name'               => 'nullable|string|max:255',
            'free_text'          => 'nullable|string|max:255',
            'type'               => 'required|string',
            'description'        => 'nullable|string',
            'prompt_description' => 'nullable|string',
            'pulseId'            => 'required|string|uuid',
            'organizationId'     => 'required|string|uuid',
        ];

        if (! $skipExistsValidation) {
            $rules['pulseId']        = 'required|exists:pulses,id';
            $rules['organizationId'] = 'required|exists:organizations,id';
        }

        $validator = Validator::make($input, $rules);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function createStrategy(array $input, bool $skipEvent = false): Strategy
    {
        $strategy = Strategy::create([
            'name'               => $input['name'] ?? '-',
            'type'               => $input['type'],
            'description'        => $input['description']               ?? null,
            'prompt_description' => $input['prompt_description'] ?? null,
            'free_text'          => $input['freeText']                    ?? null,
            'organization_id'    => $input['organizationId'],
            'pulse_id'           => $input['pulseId'],
        ]);

        if ($input['type'] === 'automations') {
            $this->createAutomation($strategy);
        }

        if (! $skipEvent) {
            event(
                new StrategiesUpdated($input['organizationId'], $input['pulseId']),
            );
        }

        return $strategy;
    }

    private function createAutomation(Strategy $strategy): bool
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        try {
            $automation_meta = StrategyService::extractAutomationType(
                $strategy->description,
            );

            $automation = Automation::create([
                'strategy_id' => $strategy->id,
                'user_id'     => $user->id,
                'on_queue'    => true,
                'type'        => $automation_meta['type'],
                'next_run_at' => $automation_meta['next_run_at'],
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return false;
        }
    }
}
