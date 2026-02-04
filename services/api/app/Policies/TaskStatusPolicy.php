<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\TaskStatus;
use App\Models\User;
use GraphQL\Error\Error;

class TaskStatusPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any task statuses.
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

        // return $user->hasPermission('read:task-statuses');
        return true;
    }

    /**
     * Determine whether the user can view a specific task status.
     */
    public function view(User $user, array $args, ?TaskStatus $taskStatus = null): bool
    {
        $taskStatus = $this->loadModel($user, $args, TaskStatus::class, $taskStatus);
        if (! $taskStatus) {
            throw new Error('Task status not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $taskStatus->pulse_id],
            model: Pulse::class,
        );

        // return $user->hasPermission('read:task-statuses');
        return true;
    }

    /**
     * Determine whether the user can create task statuses.
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

        // return $user->hasPermission('create:task-statuses');
        return true;
    }

    /**
     * Determine whether the user can update a specific task status.
     */
    public function update(User $user, array $args, ?TaskStatus $taskStatus = null): bool
    {
        $taskStatus = $this->loadModel($user, $args, TaskStatus::class, $taskStatus);
        if (! $taskStatus) {
            throw new Error('Task status not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $taskStatus->pulse_id],
            model: Pulse::class,
        );

        // return $user->hasPermission('update:task-statuses');
        return true;
    }

    /**
     * Determine whether the user can delete a specific task status.
     */
    public function delete(User $user, array $args, ?TaskStatus $taskStatus = null): bool
    {
        $taskStatus = $this->loadModel($user, $args, TaskStatus::class, $taskStatus);
        if (! $taskStatus) {
            throw new Error('Task status not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $taskStatus->pulse_id],
            model: Pulse::class,
        );

        // return $user->hasPermission('delete:task-statuses');
        return true;
    }

    /**
     * Determine whether the user can update any task statuses (batch update for order).
     */
    public function updateAny(User $user, array $args): bool
    {
        // Check if input array exists and has at least one status
        if (!isset($args['input']) || empty($args['input'])) {
            return false;
        }

        // Get the first status to check pulse membership
        // All statuses in the batch should belong to the same pulse
        $firstStatusId = $args['input'][0]['id'] ?? null;
        
        if ($firstStatusId) {
            $firstStatus = TaskStatus::find($firstStatusId);
            if ($firstStatus) {
                $this->checkPulseMembership(
                    user: $user,
                    args: ['pulse_id' => $firstStatus->pulse_id],
                    model: Pulse::class,
                );
            }
        }

        // return $user->hasPermission('update:task-statuses');
        return true;
    }
}
