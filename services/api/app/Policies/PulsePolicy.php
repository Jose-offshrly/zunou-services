<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class PulsePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any pulses.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:pulses') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific pulse.
     */
    public function view(User $user, array $args, ?Pulse $pulse = null): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class, $pulse);
        if (! $pulse || ! $pulse->isMember($user)) {
            return false;
        }

        return ($user->hasPermission('read:pulses') && $this->hasOrganization($pulse)) || $user->hasPermission('admin:pulses');
    }

    /**
     * Determine whether the user can create pulses.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:pulses') && $user->hasOrganization($args['input']['pulse']['organizationId']);
    }

    /**
     * Determine whether the user can update the pulse.
     */
    public function update(User $user, array $args, ?Pulse $pulse = null): bool
    {
        $pulse = $this->loadModel($user, $args['input'], Pulse::class, $pulse);
        if (! $pulse && ! $pulse->userHasRole($user, ['owner', 'admin'])) {
            return false;
        }

        return ($user->hasPermission('update:pulses') && $this->hasOrganization($pulse)) || $user->hasPermission('admin:pulses');
    }

    public function updateAny(User $user, array $args): bool
    {
        // This method is used to update the order of pulses
        return $user->hasPermission('update:pulses') || $user->hasPermission('admin:pulses');
    }

    /**
     * Determine whether the user can delete the pulse.
     */
    public function delete(User $user, array $args, ?Pulse $pulse = null): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class, $pulse);
        if (! $pulse && ! $pulse->userHasRole($user, 'owner')) {
            return false;
        }

        return ($user->hasPermission('delete:pulses') && $this->hasOrganization($pulse)) || $user->hasPermission('admin:pulses');
    }

    /**
     * Determine whether the user can restore a pulse.
     */
    public function restore(User $user, array $args, ?Pulse $pulse = null): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete a pulse.
     */
    public function forceDelete(
        User $user,
        array $args,
        ?Pulse $pulse = null,
    ): bool {
        return false;
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
            $loadedModel = Pulse::find($args['id']);
        }

        return $loadedModel;
    }
}
