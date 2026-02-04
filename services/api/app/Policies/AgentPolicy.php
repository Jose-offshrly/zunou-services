<?php

namespace App\Policies;

use App\Models\Agent;
use App\Models\Pulse;
use App\Models\User;

class AgentPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:agents') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?Agent $agent = null): bool
    {
        $agent = $this->loadModel($user, $args, Agent::class, $agent);
        if (! $agent) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return ($user->hasPermission('read:agents') && $this->hasOrganization($agent)) || $user->hasPermission('admin:agents');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:agents') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, ?Agent $agent = null): bool
    {
        $agent = $this->loadModel($user, $args, Agent::class, $agent);
        if (! $agent) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $agent->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:agents') && $this->hasOrganization($agent);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, array $args, ?Agent $agent = null): bool
    {
        $agent = $this->loadModel($user, $args, Agent::class, $agent);
        if (! $agent) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $agent->pulse_id,
        ], model: Pulse::class);

        return ($user->hasPermission('delete:agents') && $this->hasOrganization($agent)) || $user->hasPermission('admin:agents');
    }
}
