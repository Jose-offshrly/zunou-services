<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;

class OrganizationUserPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:users');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        OrganizationUser $organizationUser = null,
    ): bool {
        $organizationUser = $this->loadModel(
            $user,
            $args,
            OrganizationUser::class,
            $organizationUser,
        );
        if (! $organizationUser) {
            return false;
        }

        return ($user->hasPermission('read:users') && $this->hasOrganization($organizationUser)) || $user->hasPermission('admin:users');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:users');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        Organization $organization = null,
    ): bool {
        return $user->hasPermission('update:users');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        OrganizationUser $organizationUser = null,
    ): bool {
        $organizationUser = $this->loadModel(
            $user,
            $args,
            OrganizationUser::class,
            $organizationUser,
        );
        if (! $organizationUser) {
            return false;
        }

        return ($user->hasPermission('delete:users') && $this->hasOrganization($organizationUser)) || $user->hasPermission('admin:users');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        OrganizationUser $organizationUser = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        OrganizationUser $organizationUser = null,
    ): bool {
        return false;
    }
}
