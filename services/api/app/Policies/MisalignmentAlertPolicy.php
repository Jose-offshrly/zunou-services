<?php

namespace App\Policies;

use App\Models\MisalignmentAlert;
use App\Models\User;

class MisalignmentAlertPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        // Ensure user has the appropriate permission and belongs to the organization
        return $user->hasPermission('read:misalignmentAlerts') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        MisalignmentAlert $misalignmentAlert = null,
    ): bool {
        // Check permission and if user is in the organization
        return $user->hasPermission('read:misalignmentAlerts') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:misalignmentAlerts') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function acknowledge(
        User $user,
        array $args,
        MisalignmentAlert $alert = null,
    ): bool {
        // Ensure the user has the appropriate permission and belongs to the organization (from $args)
        return $user->hasPermission('update:misalignmentAlerts') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        MisalignmentAlert $misalignmentAlert = null,
    ): bool {
        return $user->hasPermission('delete:misalignmentAlerts') && $user->hasOrganization($args['organizationId']);
    }
}
