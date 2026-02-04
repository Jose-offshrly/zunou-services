<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\Task;
use App\Models\User;
use GraphQL\Error\Error;

class TaskPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any tasks.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:tasks') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific task.
     */
    public function view(User $user, array $args, ?Task $task = null): bool
    {
        $task = $this->loadModel($user, $args, Task::class, $task);
        if (! $task) {
            return throw new Error('Task not found!');
        }

        return $user->hasPermission('read:tasks') && $user->hasOrganization($task->organization_id);
    }

    /**
     * Determine whether the user can create tasks.
     */
    public function create(User $user, array $args): bool
    {
        // Check if entity_id refers to a pulse and verify membership
        if (
            isset($args['input'][0]['entity_id']) && isset($args['input'][0]['entity_type']) && $args['input'][0]['entity_type'] === 'PULSE'
        ) {
            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $args['input'][0]['entity_id'],
                ],
                model: Pulse::class,
            );
        }

        return $user->hasPermission('create:tasks') && $user->hasOrganization($args['input'][0]['organization_id']);
    }

      /**
     * Determine whether the user can create tasks.
     */
    public function smartCreate(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $args['input']['entity_id'],
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('create:tasks') && $user->hasOrganization($args['input']['organization_id']);
    }

    /**
     * Determine whether the user can update a specific task.
     */
    public function update(User $user, array $args, ?Task $task = null): bool
    {
        $task = $this->loadModel($user, $args, Task::class, $task);
        if (! $task) {
            return throw new Error('Task not found!');
        }

        // Check pulse membership if task is associated with a pulse
        if ($task->entity_type === 'PULSE' && $task->entity_id) {
            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $task->entity_id,
                ],
                model: Pulse::class,
            );
        }

        return $user->hasPermission('update:tasks') && $user->hasOrganization($task->organization_id);
    }

    /**
     * Determine whether the user can delete a specific task.
     */
    public function delete(User $user, array $args, ?Task $task = null): bool
    {
        $task = $this->loadModel($user, $args, Task::class, $task);
        if (! $task) {
            return throw new Error('Task not found!');
        }

        // Check pulse membership if task is associated with a pulse
        if ($task->entity_type === 'PULSE' && $task->entity_id) {
            $this->checkPulseMembership(
                user: $user,
                args: [
                    'pulse_id' => $task->entity_id,
                ],
                model: Pulse::class,
            );
        }

        return $user->hasPermission('delete:tasks') && $user->hasOrganization($task->organization_id);
    }

    /**
     * Determine whether the user can update any task.
     */
    public function updateAny(User $user, array $args): bool
    {
        return $user->hasPermission('update:tasks') && $user->hasOrganization($args['input'][0]['organizationId']);
    }
}
