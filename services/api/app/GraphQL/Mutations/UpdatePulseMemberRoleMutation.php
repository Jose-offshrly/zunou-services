<?php

namespace App\GraphQL\Mutations;

use App\Enums\PulseCategory;
use App\Enums\PulseMemberRole;
use App\Models\Pulse;
use App\Models\PulseMember;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

final readonly class UpdatePulseMemberRoleMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $pulse = Pulse::findOrFail($args['input']['pulseId']);
        if (
            in_array(
                $pulse->category?->value,
                [
                    PulseCategory::ONETOONE->value,
                    PulseCategory::PERSONAL->value,
                ],
                true,
            )
        ) {
            throw new Error(
                'Cannot update member roles for a pulse with category ONETOONE or PERSONAL.',
            );
        }
        try {
            $this->validateInput($args['input']);

            return $this->updatePulseMember($args['input']);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update pulse member: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input)
    {
        $validator = Validator::make($input, [
            'role'           => 'required|string',
            'pulseId'        => 'required|exists:pulses,id',
            'userId'         => 'required|exists:users,id',
            'organizationId' => 'required|exists:organizations,id',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function updatePulseMember(array $input): PulseMember
    {
        return DB::transaction(function () use ($input) {
            if ($input['role'] === PulseMemberRole::OWNER->value) {
                PulseMember::query()
                    ->where('pulse_id', $input['pulseId'])
                    ->where('role', PulseMemberRole::OWNER->value)
                    ->update(['role' => PulseMemberRole::ADMIN->value]);
            }

            $pulseMember = PulseMember::query()
                ->wherePulseId($input['pulseId'])
                ->whereUserId($input['userId'])
                ->first();

            $pulseMember->role = $input['role'];
            $pulseMember->save();

            return $pulseMember->refresh();
        });
    }
}
