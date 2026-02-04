<?php

namespace App\GraphQL\Mutations;

use App\Enums\OrganizationUserRole;
use App\Models\OrganizationUser;
use App\Services\Auth0RoleService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Validator;

final readonly class UpdateOrganizationUserRoleMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): OrganizationUser
    {
        try {
            $this->validateInput($args['input']);

            return $this->updateOrganizationUser($args['input']);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update organization user: ' . $e->getMessage(),
            );
        }
    }

    private function validateInput(array $input): void
    {
        $validator = Validator::make($input, [
            'role'           => 'required|string',
            'organizationId' => 'required|exists:organizations,id',
            'userId'         => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function updateOrganizationUser(array $input): OrganizationUser
    {
        $organizationUser = OrganizationUser::query()
            ->whereOrganizationId($input['organizationId'])
            ->whereUserId($input['userId'])
            ->first();

        if (! $organizationUser) {
            throw new Error('Organization user not found');
        }

        $oldRole = $organizationUser->role;
        $newRole = $input['role'];

        // Update the role
        $organizationUser->role = $newRole;
        $organizationUser->save();

        // Update user permissions only if role actually changed
        if ($oldRole !== $newRole) {
            \Log::info('Organization user role changed', [
                'user_id'         => $organizationUser->user_id,
                'organization_id' => $input['organizationId'],
                'old_role'        => $oldRole,
                'new_role'        => $newRole,
            ]);

            $this->updateUserPermissions($organizationUser->user, $newRole);
        }

        return $organizationUser->refresh();
    }

    private function updateUserPermissions($user, string $newRole): void
    {
        // Only update permissions if user has auth0_id
        if (! $user->auth0_id) {
            return;
        }

        $managerRoleId = Config::get('auth0.roles.manager');
        $userRoleId    = Config::get('auth0.roles.user');
        $guestRoleId   = Config::get('auth0.roles.guest');

        $roleId = match ($newRole) {
            OrganizationUserRole::Owner->value => $managerRoleId,
            OrganizationUserRole::User->value  => $userRoleId,
            OrganizationUserRole::Guest->value => $guestRoleId,
            default                            => null,
        };

        if ($roleId) {
            try {
                // Replace old roles with new role and get permissions
                $permissions = Auth0RoleService::replaceRoles(
                    $user->auth0_id,
                    $roleId,
                );

                if ($permissions) {
                    // Update user permissions in database
                    $user->permissions = $permissions;
                    $user->save();

                    \Log::info(
                        'Successfully updated user permissions for role change',
                        [
                            'user_id'           => $user->id,
                            'new_role'          => $newRole,
                            'permissions_count' => count($permissions),
                        ],
                    );
                }
            } catch (\Exception $e) {
                // Log the error but don't fail the role update
                \Log::error(
                    'Failed to update user permissions for role change',
                    [
                        'user_id'  => $user->id,
                        'new_role' => $newRole,
                        'error'    => $e->getMessage(),
                    ],
                );
            }
        }
    }
}
