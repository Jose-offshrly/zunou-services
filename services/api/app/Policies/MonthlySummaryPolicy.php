<?php

namespace App\Policies;

use App\Models\MonthlySummary;
use App\Models\User;

class MonthlySummaryPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:monthlySummary') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        MonthlySummary $monthlySummary = null,
    ): bool {
        return $user->hasPermission('read:monthlySummary') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:monthlySummary') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        MonthlySummary $monthlySummary = null,
    ): bool {
        return $user->hasPermission('update:monthlySummary') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        MonthlySummary $monthlySummary = null,
    ): bool {
        return $user->hasPermission('delete:monthlySummary') && $user->hasOrganization($args['organizationId']);
    }
}
