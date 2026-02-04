<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Helpers\TaskStatusSyncHelper;
use App\Models\Task;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class UpdateTaskStatusAction
{
    /**
     * Update the status and/or task_status_id of a task.
     *
     * @param Task $task The task to update
     * @param string|null $status The enum status value (TODO, INPROGRESS, COMPLETED, OVERDUE)
     * @param string|null $taskStatusId The custom task status ID from task_statuses table
     * @return Task The updated task
     * @throws Error If the task status update fails or lock cannot be acquired
     */
    public function handle(Task $task, ?string $status, ?string $taskStatusId = null): Task
    {
        try {
            $result = Cache::lock("task:{$task->id}:status-update", 5)->block(
                3,
                function () use ($task, $status, $taskStatusId) {
                    return DB::transaction(function () use ($task, $status, $taskStatusId) {
                        $updateData = [];
                        
                        if ($status !== null) {
                            $updateData['status'] = $status;
                        }
                        
                        if ($taskStatusId !== null) {
                            $updateData['task_status_id'] = $taskStatusId;
                        }
                        
                        $task->update($updateData);

                        // Sync task_status_id to match enum status only if we're updating status
                        // and not explicitly setting task_status_id
                        if ($status !== null && $taskStatusId === null) {
                            TaskStatusSyncHelper::syncEnumToCustomStatus(
                                $task->refresh(),
                                $task->entity_id
                            );
                        }

                        return $task->refresh();
                    });
                }
            );

            if ($result === false) {
                throw new Error('Could not acquire lock to update task status');
            }

            return $result;
        } catch (\Throwable $e) {
            throw new Error(
                'Failed to update task status: ' . $e->getMessage()
            );
        }
    }
}
