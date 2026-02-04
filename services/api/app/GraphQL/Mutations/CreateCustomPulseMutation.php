<?php

namespace App\GraphQL\Mutations;

use App\Enums\PulseMemberRole;
use App\Jobs\NewPulseSeedToVectorDB;
use App\Models\Organization;
use App\Models\Pulse;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CreateCustomPulseMutation
{
    public function __construct(
        private CreatePulseMemberMutation $pulseMemberMutation,
    ) {
    }

    /**
     * Creates a new Pulse for an organization based on a live MasterPulse.
     *
     * @param null $_
     * @param array $args
     * @return Pulse
     * @throws \Exception
     */
    public function __invoke($_, array $args): Pulse
    {
        return DB::transaction(function () use ($_, $args) {
            $userId = Auth::id();
            try {
                $this->validateInput($args['input']);

                $organization = Organization::findOrFail(
                    $args['input']['organizationId'],
                );

                // Create a new Pulse for the organization
                $pulse = $this->createPulse($args['input']);

                // Automatically create pulse member
                $this->pulseMemberMutation->__invoke($_, [
                    'pulseId' => $pulse->id,
                    'input'   => [
                        [
                            'role'   => PulseMemberRole::OWNER->value,
                            'userId' => $userId,
                        ],
                    ],
                ]);

                $this->dispatchDataSeedingJob($organization, $pulse);

                return $pulse;
            } catch (\Exception $e) {
                throw new Error(
                    'Failed to create custom pulse: ' . $e->getMessage(),
                );
            }
        });
    }

    private function validateInput(array $input)
    {
        $validator = Validator::make($input, [
            'name'           => 'required|string|max:255',
            'description'    => 'nullable|string',
            'organizationId' => 'required|exists:organizations,id',
            'features'       => 'nullable|array|min:1',
            'features.*'     => 'string',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function createPulse(array $input)
    {
        $pulse                  = new Pulse();
        $pulse->name            = $input['name'];
        $pulse->description     = $input['description'] ?? null;
        $pulse->type            = 'generic';
        $pulse->organization_id = $input['organizationId'];
        $pulse->features        = $input['features'] ?? null;
        $pulse->save();

        return $pulse;
    }

    private function dispatchDataSeedingJob($organization, $pulse)
    {
        NewPulseSeedToVectorDB::dispatch($organization->id, $pulse->id);

        Log::info(
            "Seeding job dispatched for organization {$organization->id} and pulse {$pulse->id}",
        );
    }
}
