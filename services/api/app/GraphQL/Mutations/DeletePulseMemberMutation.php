<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\PulseMember\DeletePulseMemberAction;
use App\Enums\PulseCategory;
use App\Enums\PulseMemberRole;
use App\Models\PulseMember;
use GraphQL\Error\Error;

final class DeletePulseMemberMutation
{
    public function __construct(
        private readonly DeletePulseMemberAction $deletePulseMemberAction,
    ) {
    }

    /**
     * @throws Error
     */
    public function __invoke(null $_, array $args): bool
    {
        $pulseMember = PulseMember::find($args['pulseMemberId']);

        if (! $pulseMember) {
            throw new Error('pulse member not found');
        }

        $pulse = $pulseMember->pulse;
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
            // Do not allow deleting the owner
            if ($pulseMember->role === PulseMemberRole::OWNER) {
                throw new Error(
                    'Cannot delete the owner of a ONETOONE or PERSONAL pulse.',
                );
            }
            // Do not allow deleting the last member
            if ($pulse->members()->count() <= 1) {
                throw new Error(
                    'Cannot delete the last member of a ONETOONE or PERSONAL pulse.',
                );
            }
        }

        return $this->deletePulseMemberAction->handle(
            pulseMember: $pulseMember,
        );
    }
}
