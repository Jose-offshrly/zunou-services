<?php

namespace App\Policies;

use App\Models\AiAgent;
use App\Models\Pulse;
use App\Models\User;

class AiAgentPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:ai-agents') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?AiAgent $aiAgent = null): bool
    {
        $aiAgent = $this->loadModel($user, $args, AiAgent::class, $aiAgent);
        if (! $aiAgent) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return ($user->hasPermission('read:ai-agents') && $this->hasOrganization($aiAgent)) || $user->hasPermission('admin:ai-agents');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:ai-agents') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, ?AiAgent $aiAgent = null): bool
    {
        $aiAgent = $this->loadModel($user, $args, AiAgent::class, $aiAgent);
        if (! $aiAgent) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $aiAgent->pulse_id,
        ], model: Pulse::class);

        return ($user->hasPermission('update:ai-agents') && $this->hasOrganization($aiAgent)) || $user->hasPermission('admin:ai-agents');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, array $args, ?AiAgent $aiAgent = null): bool
    {
        $aiAgent = $this->loadModel($user, $args, AiAgent::class, $aiAgent);
        if (! $aiAgent) {
            return false;
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $aiAgent->pulse_id,
        ], model: Pulse::class);

        return ($user->hasPermission('delete:ai-agents') && $this->hasOrganization($aiAgent)) || $user->hasPermission('admin:ai-agents');
    }
}
