<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:organizations');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        ?Organization $organization = null,
    ): bool {
        $organization = $this->loadModel(
            $user,
            $args,
            Organization::class,
            $organization,
        );
        if (! $organization) {
            \Log::info(
                'Organization view policy check failed: organization not found',
            );

            return false;
        }

        $hasReadPermission     = $user->hasPermission('read:organizations');
        $hasAdminPermission    = $user->hasPermission('admin:organizations');
        $hasManagePermission   = $user->hasPermission('manage:organizations');
        $belongsToOrganization = $user->hasOrganization($organization->id);

        $canView = ($organization && $hasReadPermission && $belongsToOrganization) || $hasAdminPermission || $hasManagePermission;

        return $canView;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Organization $organization = null,
    ): bool {
        $organization = $this->loadModel(
            $user,
            $args,
            Organization::class,
            $organization,
        );
        if (! $organization) {
            return false;
        }

        return ($organization && $user->hasPermission('update:organizations') && $user->hasOrganization($organization->id)) || $user->hasPermission('admin:organizations');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?Organization $organization = null,
    ): bool {
        $organization = $this->loadModel(
            $user,
            $args,
            Organization::class,
            $organization,
        );
        if (! $organization) {
            return false;
        }

        return ($organization && $user->hasPermission('delete:organizations') && $user->hasOrganization($organization->id)) || $user->hasPermission('admin:organizations');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        array $args,
        ?Organization $organization = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        ?Organization $organization = null,
    ): bool {
        return false;
    }
}
