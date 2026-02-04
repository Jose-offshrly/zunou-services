<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\User;
use App\Services\InviteUserService;
use Illuminate\Support\Collection;

final readonly class InviteUserMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Collection
    {
        $invitedUsers = [];
        foreach ($args['input'] as $user) {
            $user = InviteUserService::perform(
                email: $user['email'],
                name: $user['name'],
                organizationId: $user['organization_id'],
                role: $user['role'] ?? null,
            );

            $invitedUsers[] = $user;
        }

        return User::whereIn('id', $invitedUsers)->get();
    }
}
