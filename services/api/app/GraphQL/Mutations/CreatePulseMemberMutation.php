<?php

namespace App\GraphQL\Mutations;

use App\Enums\PulseMemberRole;
use App\Models\Pulse;
use App\Models\PulseMember;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CreatePulseMemberMutation
{
    /**
     * Creates a new member for a Pulse.
     *
     * @param  null  $_
     *
     * @throws \Exception
     */
    public function __invoke($_, array $args): array
    {
        $pulse = Pulse::findOrFail($args['pulseId']);

        try {
            return DB::transaction(function () use ($args) {
                $pulseMembers = [];

                foreach ($args['input'] as $user) {
                    if (! empty($user)) {
                        $this->validateInput($user, $args['pulseId']);

                        $pulseMember = $this->createPulseMember(
                            $user,
                            $args['pulseId'],
                        );

                        $pulseMembers[] = $pulseMember;
                    }
                }

                return $pulseMembers;
            });
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a pulse member: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input, string $pulseId): void
    {
        $inputs = array_merge($input, ['pulseId' => $pulseId]);

        $validator = Validator::make($inputs, [
            'role'    => 'required|string',
            'pulseId' => 'required|exists:pulses,id',
            'userId'  => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function createPulseMember(
        array $input,
        string $pulseId,
    ): PulseMember {
        $pulse          = Pulse::findOrFail($pulseId);
        $category       = $pulse->category;
        $organizationId = $pulse->organization_id;
        // get pulse
        PulseMember::where('user_id', $input['userId'])
            ->whereHas('pulse', function ($query) use (
                $category,
                $organizationId
            ) {
                $query
                    ->where('category', $category)
                    ->where('organization_id', $organizationId);
            })
            ->increment('order');

        $pulseMember = PulseMember::firstOrCreate(
            [
                'pulse_id' => $pulseId,
                'user_id'  => $input['userId'],
            ],
            [
                'pulse_id' => $pulseId,
                'user_id'  => $input['userId'],
                'role'     => PulseMemberRole::from($input['role']),
                'order'    => 1,
            ],
        );

        return $pulseMember->refresh()->load(['pulse', 'user', 'organizationUser']);
    }
}
