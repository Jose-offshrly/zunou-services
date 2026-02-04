<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrganizationUserRole;
use App\Enums\OrganizationUserStatus;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class InvitationService
{
    /**
     * Accept a single invitation by code (used by magic-link flow).
     */
    public static function acceptByCode(string $inviteCode, string $auth0Id): ?OrganizationUser
    {
        /** @var OrganizationUser|null $orgUser */
        $orgUser = OrganizationUser::where('invite_code', $inviteCode)->first();

        if (! $orgUser) {
            return null;
        }

        // If already accepted, just ensure user/auth0 stay in sync and exit cleanly.
        if ($orgUser->status === OrganizationUserStatus::Active->value) {
            self::syncUserAuth0($orgUser->user, $auth0Id, $orgUser->role);
            return $orgUser;
        }

        return DB::transaction(function () use ($orgUser, $auth0Id) {
            self::syncUserAuth0($orgUser->user, $auth0Id, $orgUser->role);

            $orgUser->status = OrganizationUserStatus::Active->value;
            $orgUser->save();

            return $orgUser;
        });
    }

    /**
     * Accept all pending invitations that belong to this user (used on first sign-in).
     * Returns the list of organization_user IDs that were activated.
     */
    public static function acceptAllPendingForUser(User $user, string $auth0Id): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, OrganizationUser> $pending */
        $pending = OrganizationUser::where('user_id', $user->id)
            ->where('status', OrganizationUserStatus::Invited->value)
            ->get();

        if ($pending->isEmpty()) {
            return [];
        }

        $activatedIds = [];

        DB::transaction(function () use ($pending, $user, $auth0Id, &$activatedIds) {
            foreach ($pending as $orgUser) {
                self::syncUserAuth0($user, $auth0Id, $orgUser->role);

                $orgUser->status = OrganizationUserStatus::Active->value;
                $orgUser->save();

                $activatedIds[] = $orgUser->id;
            }
        });

        Log::info('Auto-accepted pending invitations for user', [
            'user_id' => $user->id,
            'count' => count($activatedIds),
            'org_user_ids' => $activatedIds,
        ]);

        return $activatedIds;
    }

    /**
     * Map org role -> Auth0 role, assign it, and persist permissions on the user.
     * Idempotent: adding an existing role in Auth0 should be a no-op in your service.
     */
    private static function syncUserAuth0(User $user, string $auth0Id, string $orgRole): void
    {
        $managerRoleId = Config::get('auth0.roles.manager');
        $userRoleId    = Config::get('auth0.roles.user');
        $guestRoleId   = Config::get('auth0.roles.guest');

        $roleId = match ($orgRole) {
            OrganizationUserRole::Owner->value => $managerRoleId,
            OrganizationUserRole::User->value  => $userRoleId,
            OrganizationUserRole::Guest->value => $guestRoleId,
            default                            => null,
        };

        if (! $roleId) {
            return;
        }

        // Assign role in Auth0 and mirror permissions locally
        $permissions = \App\Services\Auth0RoleService::addRole($auth0Id, $roleId);

        // Ensure we bind this app user to the Auth0 subject and persist permissions
        $user->auth0_id = $auth0Id;
        $user->permissions = $permissions; // If you need a merge, do it here.
        $user->save();
    }
}