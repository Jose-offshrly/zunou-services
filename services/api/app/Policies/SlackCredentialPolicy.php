<?php

namespace App\Policies;

use App\Models\SlackCredential;
use App\Models\User;

class SlackCredentialPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:slack-credentials');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        SlackCredential $agent = null,
    ): bool {
        return $user->hasPermission('read:slack-credentials');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        SlackCredential $agent = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        SlackCredential $agent = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        array $args,
        SlackCredential $agent = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        SlackCredential $agent = null,
    ): bool {
        return false;
    }
}
