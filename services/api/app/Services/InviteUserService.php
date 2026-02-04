<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrganizationUserRole;
use App\Enums\OrganizationUserStatus;
use App\Jobs\InviteExistingUserJob;
use App\Jobs\InviteUserJob;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InviteUserService
{
    public static function perform(
        $email,
        $name,
        $organizationId,
        $role = OrganizationUserRole::User->value,
    ) {
        $managerRoleId = Config::get('auth0.roles.manager');
        $userRoleId    = Config::get('auth0.roles.user');
        $guestRoleId   = Config::get('auth0.roles.guest');

        $user = User::where('email', $email)->first();

        if ($user) {
            DB::transaction(function () use ($organizationId, $user, $role, $managerRoleId, $userRoleId, $guestRoleId) {
                $organizationUser = OrganizationUser::firstOrNew([
                    'organization_id' => $organizationId,
                    'status' => OrganizationUserStatus::Active,
                    'user_id'         => $user->id,
                ]);

                if (! $organizationUser->exists || $organizationUser->role !== $role) {
                    $organizationUser->role   = $role;
                    $organizationUser->save();
                }

                if (isset($user->auth0_id)) {
                    $roleId = match ($organizationUser->role) {
                        OrganizationUserRole::Owner->value => $managerRoleId,
                        OrganizationUserRole::User->value  => $userRoleId,
                        OrganizationUserRole::Guest->value => $guestRoleId,
                        default                            => null,
                    };

                    $permissions       = Auth0RoleService::addRole($user->auth0_id, $roleId);
                    $user->permissions = $permissions;
                    $user->save();
                }

                InviteExistingUserJob::dispatch(
                    organizationUser: $organizationUser,
                )->onQueue(('mail'));

                // Ensure user has a personal pulse for this organization
                PersonalPulseService::ensureUserHasPersonalPulse($user, (string) $organizationId);
            });
        } else {
            return DB::transaction(function () use ($email, $name, $organizationId, $role) {
                $user = User::create(
                    [
                        'email'    => $email,
                        'name'     => $name,
                        'password' => bcrypt(Str::random(16)),
                    ],
                );

                $organizationUser = OrganizationUser::create([
                    'organization_id' => $organizationId,
                    'user_id'         => $user->id,
                    'status' => OrganizationUserStatus::Active,
                    'role'            => $role,
                ]);

                InviteUserJob::dispatch(
                    organizationUserId: $organizationUser->id,
                    existing: true,
                )->onQueue(('mail'));

                return $user->id;
            });
        }

        return $user->id;
    }
}
