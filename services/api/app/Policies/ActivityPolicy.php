<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\User;

class ActivityPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        if (isset($args['pulseId'])) {
            $this->checkPulseMembership(
                user: $user,
                args: $args,
                model: Pulse::class,
            );
        }

        return $user->hasPermission('read:activities') && $user->hasOrganization($args['organizationId']);
    }
}
