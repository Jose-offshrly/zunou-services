<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\OrganizationUser;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UpdateMeMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new error('No user was found');
        }

        $organizationuser = OrganizationUser::where([
            'organization_id' => $args['lastOrganizationId'],
            'user_id'         => $user->id,
        ])->first();

        if (! $organizationuser) {
            throw new Error(
                "Your user doesn't have access to that organization",
            );
        }

        $updates = array_filter([
            'name'                 => $args['name'] ?? null,
            'last_organization_id' => $args['lastOrganizationId'],
            'timezone'             => $args['timezone'] ?? null,
            'slack_id'             => $args['slackId']  ?? null,
            'presence'             => $args['presence'] ?? null,
            'onboarded'            => $args['onboarded'] ?? null,
        ]);

        $user = User::find($user->id);
        $user->update($updates);

        return $user->fresh();
    }
}
