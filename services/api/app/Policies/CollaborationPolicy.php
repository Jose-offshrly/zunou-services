<?php

namespace App\Policies;

use App\Models\Collaboration;
use App\Models\Pulse;
use App\Models\User;

class CollaborationPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any collaborations.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:collaborations') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view a specific collaboration.
     */
    public function view(User $user, array $args, ?Collaboration $collaboration = null): bool
    {
        $collaboration = $this->loadModel($user, $args, Collaboration::class, $collaboration);
        if (! $collaboration) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return ($user->hasPermission('read:collaborations') && $this->hasOrganization($collaboration)) || $user->hasPermission('admin:collaborations');
    }

    /**
     * Determine whether the user can create collaborations.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:collaborations') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update a specific collaboration.
     */
    public function update(User $user, array $args, ?Collaboration $collaboration = null): bool
    {
        $collaboration = $this->loadModel($user, $args, Collaboration::class, $collaboration);
        if (! $collaboration) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $collaboration->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:collaborations') && $this->hasOrganization($collaboration);
    }

    /**
     * Determine whether the user can delete a specific collaboration.
     */
    public function delete(User $user, array $args, ?Collaboration $collaboration = null): bool
    {
        $collaboration = $this->loadModel($user, $args, Collaboration::class, $collaboration);
        if (! $collaboration) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $collaboration->pulse_id,
        ], model: Pulse::class);

        return ($user->hasPermission('delete:collaborations') && $this->hasOrganization($collaboration)) || $user->hasPermission('admin:collaborations');
    }
}
