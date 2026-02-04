<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Task\UpdateTaskStatusAction;
use App\Models\Task;
use GraphQL\Error\Error;

readonly class UpdateTaskStatusMutation
{
    public function __construct(
        private readonly UpdateTaskStatusAction $updateTaskStatusAction
    ) {
    }

    /**
     * Update a task's status and/or task_status_id.
     *
     * @param mixed $_ The root value (unused)
     * @param array $args The mutation arguments containing taskId, status, and optionally task_status_id
     * @return Task The updated task
     * @throws Error If the task is not found or update fails
     */
    public function __invoke($_, array $args)
    {
        try {
            $task = Task::find($args['taskId']);
            if (!$task) {
                throw new Error('Task not found!');
            }

            return $this->updateTaskStatusAction->handle(
                $task,
                $args['status'] ?? null,
                $args['task_status_id'] ?? null
            );
        } catch (\Exception $e) {
            throw new Error('Failed to update task status' . $e->getMessage());
        }
    }
}
