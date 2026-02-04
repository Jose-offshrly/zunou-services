<?php

namespace App\GraphQL\Mutations;

use App\Actions\Pulse\InvitePulseGuestAction;
use App\DataTransferObjects\GuestData;
use App\Models\User;

final readonly class InvitePulseGuestMutation
{
    /** @param array{} $args
     * @throws \Exception
     */
    public function __invoke(null $_, array $args): User
    {
        $data = new GuestData(
            email: $args['email'],
            role: $args['role'],
            organizationId: $args['organizationId'],
            pulseId: $args['pulseId'],
        );

        $action = app(InvitePulseGuestAction::class);

        return $action->handle($data);
    }
}
