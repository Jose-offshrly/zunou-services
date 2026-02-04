<?php

namespace App\Actions\Pulse;

use App\DataTransferObjects\GuestData;
use App\Enums\OrganizationUserRole;
use App\Enums\PulseCategory;
use App\Enums\PulseMemberRole;
use App\GraphQL\Mutations\CreatePulseMemberMutation;
use App\GraphQL\Mutations\InviteUserMutation;
use App\Models\Pulse;
use App\Models\User;

class InvitePulseGuestAction
{
    /**
     * @throws \Exception
     */
    public function handle(GuestData $data): User
    {
        $pulse = Pulse::findOrFail($data->pulseId);
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
            throw new \Exception(
                'Cannot invite users to a pulse with category ONETOONE or PERSONAL.',
            );
        }
        $user = $this->inviteGuestToOrganization(data: $data);

        $this->addGuestToPulse(data: $data, user: $user);

        return $user->refresh();
    }

    private function inviteGuestToOrganization(GuestData $data): User
    {
        $input = [
            'input' => [
                [
                    'email'           => $data->email,
                    'name'            => $data->email,
                    'organization_id' => $data->organizationId,
                    'role'            => OrganizationUserRole::Guest->value,
                ],
            ],
        ];

        $invite = (new InviteUserMutation())(_: null, args: $input);

        return $invite[0];
    }

    /**
     * @throws \Exception
     */
    private function addGuestToPulse(GuestData $data, User $user): void
    {
        $input = [
            'pulseId' => $data->pulseId,
            'input'   => [
                [
                    'userId' => $user->id,
                    'role'   => PulseMemberRole::GUEST->value,
                ],
            ],
        ];

        (new CreatePulseMemberMutation())(_: null, args: $input);
    }
}
