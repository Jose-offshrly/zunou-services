<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Task;
use GraphQL\Error\Error;

readonly class UpdateTaskStatusMutation
{
    public function __invoke($_, array $args)
    {
        try {
            $task = Task::find($args['taskId']);
            if (!$task) {
                throw new Error('Task not found!');
            }

            // This mutation is deprecated in favor of UpdateTaskMutation
            // which handles task_status_id updates with proper validation
            if (isset($args['status'])) {
                $task->status = $args['status'];
            }

            if (isset($args['task_status_id'])) {
                $task->task_status_id = $args['task_status_id'];
            }

            $task->save();

            return $task->refresh();

        } catch (\Exception $e) {
            throw new Error('Failed to update task status: ' . $e->getMessage());
        }
    }
}
