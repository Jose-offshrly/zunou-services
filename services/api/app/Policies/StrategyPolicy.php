<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\Strategy;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Database\Eloquent\Model;

class StrategyPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any strategies.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:strategies');
    }

    /**
     * Determine whether the user can view a specific strategy.
     */
    public function view(
        User $user,
        array $args,
        ?Strategy $strategy = null,
    ): bool {
        $strategy = $this->loadModel($user, $args, Strategy::class, $strategy);
        if (! $strategy) {
            return throw new Error('Strategy not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $strategy->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:strategies') && $user->hasOrganization($strategy->organization_id);
    }

    /**
     * Determine whether the user can create strategies.
     */
    public function create(User $user, array $args): bool
    {
        if (isset($args['input']['pulseId'])) {
            $this->checkPulseMembership(user: $user, args: $args['input'], model: Pulse::class);
        }

        return $user->hasPermission('create:strategies') && $user->hasOrganization($args['input']['organizationId']);
    }

    /**
     * Determine whether the user can update a specific strategy.
     */
    public function update(
        User $user,
        array $args,
        ?Strategy $strategy = null,
    ): bool {
        $strategy = $this->loadModel($user, $args['input'], Strategy::class, $strategy);
        if (! $strategy) {
            return throw new Error('Strategy not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $strategy->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:strategies') && $user->hasOrganization($strategy->organization_id);
    }

    /**
     * Determine whether the user can delete a specific strategy.
     */
    public function delete(
        User $user,
        array $args,
        ?Strategy $strategy = null,
    ): bool {
        $strategy = $this->loadModel($user, $args, Strategy::class, $strategy);
        if (! $strategy) {
            return throw new Error('Strategy not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $strategy->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:strategies') && $user->hasOrganization($strategy->organization_id);
    }

    /**
     * Dynamically load a model instance based on provided arguments.
     */
    protected function loadModel(
        User $user,
        array $args,
        string $modelClass,
        ?Model $model = null,
    ): ?Model {
        $loadedModel = parent::loadModel($user, $args, $modelClass, $model);

        if ($loadedModel == null && isset($args['id'])) {
            $loadedModel = Strategy::find($args['id']);
        }

        return $loadedModel;
    }
}
