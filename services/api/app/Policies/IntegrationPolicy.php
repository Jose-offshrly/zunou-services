<?php

namespace App\Policies;

use App\Models\Integration;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class IntegrationPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:integrations');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        ?Integration $integration = null,
    ): bool {
        $integration = $this->loadModel(
            $user,
            $args,
            Integration::class,
            $integration,
        );

        if (! $integration) {
            return throw new Error('Integration not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $integration->pulse_id,
        ], model: Pulse::class);

        if ($integration->user_id !== $user->id) {
            return false;
        }

        return $user->hasPermission('read:integrations');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:integrations');
    }

    /**
     * Determine whether the user can delete the pulse.
     */
    public function delete(
        User $user,
        array $args,
        ?Integration $integration = null,
    ): bool {
        $integration = $this->loadModel(
            $user,
            $args,
            Integration::class,
            $integration,
        );

        if (! $integration) {
            throw new Error('Integration not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $integration->pulse_id,
        ], model: Pulse::class);

        if ($integration->user_id !== $user->id) {
            return false;
        }

        return $user->hasPermission('delete:integrations');
    }
}
