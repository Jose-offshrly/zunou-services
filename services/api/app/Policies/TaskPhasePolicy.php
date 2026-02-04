<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\TaskPhase;
use App\Models\User;
use GraphQL\Error\Error;

class TaskPhasePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any task phases.
     */
    public function viewAny(User $user, array $args): bool
    {
        if (isset($args['pulseId'])) {
            $this->checkPulseMembership(
                user: $user,
                args: ['pulse_id' => $args['pulseId']],
                model: Pulse::class,
            );
        }

        return $user->hasPermission('read:task-phases');
    }

    /**
     * Determine whether the user can view a specific task phase.
     */
    public function view(User $user, array $args, ?TaskPhase $taskPhase = null): bool
    {
        $taskPhase = $this->loadModel($user, $args, TaskPhase::class, $taskPhase);
        if (! $taskPhase) {
            throw new Error('Task phase not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $taskPhase->pulse_id],
            model: Pulse::class,
        );

        return $user->hasPermission('read:task-phases');
    }

    /**
     * Determine whether the user can create task phases.
     */
    public function create(User $user, array $args): bool
    {
        if (isset($args['input']['pulse_id'])) {
            $this->checkPulseMembership(
                user: $user,
                args: ['pulse_id' => $args['input']['pulse_id']],
                model: Pulse::class,
            );
        }

        return $user->hasPermission('create:task-phases');
    }

    /**
     * Determine whether the user can update a specific task phase.
     */
    public function update(User $user, array $args, ?TaskPhase $taskPhase = null): bool
    {
        $taskPhase = $this->loadModel($user, $args, TaskPhase::class, $taskPhase);
        if (! $taskPhase) {
            throw new Error('Task phase not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $taskPhase->pulse_id],
            model: Pulse::class,
        );

        return $user->hasPermission('update:task-phases');
    }

    /**
     * Determine whether the user can delete a specific task phase.
     */
    public function delete(User $user, array $args, ?TaskPhase $taskPhase = null): bool
    {
        $taskPhase = $this->loadModel($user, $args, TaskPhase::class, $taskPhase);
        if (! $taskPhase) {
            throw new Error('Task phase not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $taskPhase->pulse_id],
            model: Pulse::class,
        );

        return $user->hasPermission('delete:task-phases');
    }
}
