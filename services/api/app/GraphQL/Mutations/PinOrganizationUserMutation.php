<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\OrganizationUser;
use App\Models\PinnedOrganizationUser;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class PinOrganizationUserMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): OrganizationUser
    {
        $user = Auth::user();
        if (!$user) {
            throw new Error('User not authenticated.');
        }

        $organizationUserId = $args['input']['organizationUserId'];
        $organizationId = $args['input']['organizationId'];

        // Verify the organization user exists and belongs to the organization
        $organizationUser = OrganizationUser::where('id', $organizationUserId)
            ->where('organization_id', $organizationId)
            ->first();

        if (!$organizationUser) {
            throw new Error('Organization user not found.');
        }

        // Check if already pinned
        $existingPin = PinnedOrganizationUser::forUser($user->id)
            ->where('organization_user_id', $organizationUserId)
            ->first();

        if ($existingPin) {
            // Already pinned, just return the organization user
            return $organizationUser;
        }

        // Create the pin
        PinnedOrganizationUser::create([
            'user_id' => $user->id,
            'organization_user_id' => $organizationUserId,
            'organization_id' => $organizationId,
            'pinned_at' => now(),
        ]);

        return $organizationUser->fresh();
    }
}
