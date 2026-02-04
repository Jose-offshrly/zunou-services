<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\OrganizationUser;
use App\Models\PinnedOrganizationUser;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class UnpinOrganizationUserMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): OrganizationUser
    {
        $user = Auth::user();
        if (!$user) {
            throw new Error('User not authenticated.');
        }

        $organizationUserId = $args['input']['organizationUserId'];

        // Find and delete the pin
        $pinnedOrganizationUser = PinnedOrganizationUser::forUser($user->id)
            ->where('organization_user_id', $organizationUserId)
            ->first();

        if ($pinnedOrganizationUser) {
            $pinnedOrganizationUser->delete();
        }

        // Return the organization user
        $organizationUser = OrganizationUser::find($organizationUserId);

        if (!$organizationUser) {
            throw new Error('Organization user not found.');
        }

        return $organizationUser;
    }
}
