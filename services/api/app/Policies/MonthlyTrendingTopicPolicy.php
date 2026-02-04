<?php

namespace App\Policies;

use App\Models\MonthlyTrendingTopic;
use App\Models\User;

class MonthlyTrendingTopicPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:monthlyTrendingTopics') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        MonthlyTrendingTopic $monthlyTrendingTopics = null,
    ): bool {
        return $user->hasPermission('read:monthlyTrendingTopics') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:monthlyTrendingTopics') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        MonthlyTrendingTopic $monthlyTrendingTopics = null,
    ): bool {
        return $user->hasPermission('update:monthlyTrendingTopics') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        MonthlyTrendingTopic $monthlyTrendingTopics = null,
    ): bool {
        return $user->hasPermission('delete:monthlyTrendingTopics') && $user->hasOrganization($args['organizationId']);
    }
}
