<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\User;

class TeamThreadPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $pulse = $this->loadModel($user, $args['input'], Pulse::class);

        if (! $pulse->isMember($user)) {
            return false;
        }

        return $user->hasPermission('create:team-threads');
    }
}
