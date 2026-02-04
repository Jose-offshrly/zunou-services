<?php

namespace App\Policies;

use App\Models\Background;
use App\Models\User;
use GraphQL\Error\Error;

class BackgroundPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:backgrounds') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?Background $background = null): bool
    {
        $background = $this->loadModel($user, $args, Background::class, $background);
        if (! $background) {
            return throw new Error('Background not found!');
        }

        if ($user->id !== $background->user_id) {
            return throw new Error('You are not allowed to view this background!');
        }

        return $user->hasPermission('read:backgrounds') && $this->hasOrganization($background);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:backgrounds') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, ?Background $background = null): bool
    {
        $background = $this->loadModel($user, $args, Background::class, $background);
        if (! $background) {
            return throw new Error('Background not found!');
        }

        if ($user->id !== $background->user_id) {
            return throw new Error('You are not allowed to update this background!');
        }

        return $user->hasPermission('update:backgrounds') && $this->hasOrganization($background);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, array $args, ?Background $background = null): bool
    {
        $background = $this->loadModel($user, $args, Background::class, $background);
        if (! $background) {
            return throw new Error('Background not found!');
        }

        if ($user->id !== $background->user_id) {
            return throw new Error('You are not allowed to delete this background!');
        }

        return $user->hasPermission('delete:backgrounds') && $this->hasOrganization($background);
    }
}
