<?php

namespace App\GraphQL\Mutations;

use App\Enums\PulseCategory;
use App\Enums\PulseMemberRole;
use App\Models\Pulse;
use App\Models\PulseMember;
use App\Services\CacheService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

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
                    PulseCategory::PERSONAL->value,
                ],
                true,
            )
        ) {
            throw new Error(
                'Cannot update member roles for a pulse with category PERSONAL.',
            );
        }
        try {
            $input = $args['input'];
            $input['role'] = $input['role'] instanceof PulseMemberRole
                ? $input['role']->value
                : $input['role'];

            $this->validateInput($input);

            return $this->updatePulseMember($input);
        } catch (\Exception $e) {
            if ($e instanceof Error) {
                throw $e;
            }
            throw new Error(
                'Failed to update pulse member: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'role'           => ['required', Rule::in(array_column(PulseMemberRole::cases(), 'value'))],
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
            $pulseMember = PulseMember::query()
                ->wherePulseId($input['pulseId'])
                ->whereUserId($input['userId'])
                ->first();

            if (! $pulseMember) {
                throw new Error('User is not a member of this pulse.');
            }

            if ($pulseMember->role->value === $input['role']) {
                return $pulseMember;
            }

            if (
                $input['role'] === PulseMemberRole::OWNER->value
                && $pulseMember->role->value !== PulseMemberRole::OWNER->value
            ) {
                $demotedOwners = PulseMember::query()
                    ->where('pulse_id', $input['pulseId'])
                    ->where('role', PulseMemberRole::OWNER->value)
                    ->get();

                $demotedOwners->each(function ($m) {
                    $m->update(['role' => PulseMemberRole::ADMIN->value]);
                    CacheService::clearLighthouseCache('PulseMember', $m->id);
                });
            }

            $pulseMember->role = $input['role'];
            $pulseMember->save();

            // Clear Lighthouse cache BEFORE returning to ensure fresh data in response
            // (Observer clears cache after commit, which is too late for the response)
            CacheService::clearLighthouseCache('PulseMember', $pulseMember->id);

            return $pulseMember->refresh();
        });
    }
}
