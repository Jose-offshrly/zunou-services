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
     * @param $_
     * @param  array  $args
     * @return array
     * @throws Error
     * @throws \Throwable
     */
    public function __invoke($_, array $args): array
    {
        $pulse = Pulse::findOrFail($args['pulseId']);

        try {
            return DB::transaction(function () use ($args, $pulse) {
                // Filter out empty inputs first
                $validInputs = array_filter($args['input'], fn ($user) => ! empty($user));

                if (empty($validInputs)) {
                    return [];
                }

                // Validate all inputs upfront
                foreach ($validInputs as $user) {
                    $this->validateInput($user, $args['pulseId']);
                }

                // Bulk increment order for all affected pulse members once
                $userIds = array_column($validInputs, 'userId');
                PulseMember::whereIn('user_id', $userIds)
                    ->whereHas('pulse', function ($query) use ($pulse) {
                        $query
                            ->where('category', $pulse->category)
                            ->where('organization_id', $pulse->organization_id);
                    })
                    ->increment('order');

                // Create all pulse members
                $pulseMemberIds = [];
                foreach ($validInputs as $user) {
                    $pulseMember = PulseMember::firstOrCreate(
                        [
                            'pulse_id' => $pulse->id,
                            'user_id'  => $user['userId'],
                        ],
                        [
                            'pulse_id' => $pulse->id,
                            'user_id'  => $user['userId'],
                            'role'     => PulseMemberRole::from($user['role']),
                            'order'    => 1,
                        ],
                    );
                    $pulseMemberIds[] = $pulseMember->id;
                }

                // Eager load all relationships in a single query
                return PulseMember::whereIn('id', $pulseMemberIds)
                    ->with(['pulse', 'user', 'organizationUser'])
                    ->get()
                    ->all();
            });
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a pulse member: ' . $e->getMessage(),
            );
        }
    }

    /**
     * @param  array  $input
     * @param  string  $pulseId
     * @return void
     * @throws Error
     */
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

}
