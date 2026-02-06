<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Assignee\CreateAssigneeAction;
use App\DataTransferObjects\Task\TaskData;
use App\Enums\TaskStatus as TaskStatusEnum;
use App\Enums\TaskStatusSystemType;
use App\Models\Task;
use App\Models\TaskStatus;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class UpdateTaskAction
{
    public function __construct(
        private readonly CreateAssigneeAction $createAssigneeAction
    ) {
    }

    public function handle(Task $task, TaskData $data): Task
    {
        $authId = Auth::id();

        return DB::transaction(function () use ($task, $data, $authId) {
            // Sync task_status_id to status enum (one-directional)
            $status = $this->syncTaskStatusToEnum($data->task_status_id, $task->status->value);
            
            $updateData = [
                'title' => $data->title,
                'description' => $data->description,
                'category_id' => $data->category_id,
                'organization_id' => $data->organization_id,
                'status' => $status,
                'parent_id' => $data->parent_id,
                'due_date' => $data->due_date,
                'start_date' => $data->start_date,
                'task_phase_id' => $data->task_phase_id,
                'task_status_id' => $data->task_status_id,
                'progress' => $data->progress,
                'color' => $data->color,
                'updated_by' => $authId,
            ];

            if (isset($data->priority)) {
                $updateData['priority'] = $data->priority;
            }

            if (isset($data->assignees)) {
                $task->assignees()->delete();
                $this->assignTask(task: $task, data: $data);
            }

            $task->update($updateData);

            if (isset($data->dependency_task_ids)) {
                $this->validateAndSyncDependencies(
                    $task,
                    $data->dependency_task_ids
                );
            }

            return $task->refresh();
        });
    }

    private function assignTask(Task $task, TaskData $data): void
    {
        foreach ($data->assignees as $assignee) {
            $user = User::find($assignee);
            if (!$user) {
                throw new Error('User not found!');
            }

            $this->createAssigneeAction->handle(entity: $task, user: $user);
        }
    }

    /**
     * Validate and sync task dependencies with circular chain and same-entity checks
     */
    private function validateAndSyncDependencies(
        Task $task,
        array $dependencyTaskIds
    ): void {
        // Prevent self-dependency
        if (in_array($task->id, $dependencyTaskIds)) {
            throw new Error('A task cannot depend on itself.');
        }

        // Load all dependency tasks and validate they exist and belong to same entity
        $dependencyTasks = Task::whereIn('id', $dependencyTaskIds)->get();

        if ($dependencyTasks->count() !== count($dependencyTaskIds)) {
            throw new Error('One or more dependency tasks not found.');
        }

        foreach ($dependencyTasks as $dependencyTask) {
            // Validate same entity
            if (
                $dependencyTask->entity_id !== $task->entity_id ||
                $dependencyTask->entity_type !== $task->entity_type
            ) {
                throw new Error(
                    "Task dependencies must be within the same entity. Task '{$dependencyTask->title}' belongs to a different entity."
                );
            }
        }

        // Check for circular dependencies
        foreach ($dependencyTaskIds as $dependencyTaskId) {
            if (
                $this->wouldCreateCircularDependency(
                    $task->id,
                    $dependencyTaskId
                )
            ) {
                $dependencyTask = $dependencyTasks->firstWhere(
                    'id',
                    $dependencyTaskId
                );
                throw new Error(
                    "Adding this dependency would create a circular chain with task '{$dependencyTask->title}'."
                );
            }
        }

        // All validations passed - sync dependencies
        $task->dependencies()->sync($dependencyTaskIds);
    }

    /**
     * Check if adding a dependency would create a circular chain
     * Returns true if dependencyTaskId already depends (directly or transitively) on taskId
     */
    private function wouldCreateCircularDependency(
        string $taskId,
        string $dependencyTaskId
    ): bool {
        // Get all tasks that the dependency task depends on (recursively)
        $visited = [];
        $toCheck = [$dependencyTaskId];

        while (!empty($toCheck)) {
            $currentId = array_shift($toCheck);

            if ($currentId === $taskId) {
                return true; // Circular dependency detected
            }

            if (in_array($currentId, $visited)) {
                continue; // Already checked this task
            }

            $visited[] = $currentId;

            // Get all dependencies of the current task
            $dependencies = DB::table('task_dependencies')
                ->where('task_id', $currentId)
                ->pluck('depends_on_task_id')
                ->toArray();

            $toCheck = array_merge($toCheck, $dependencies);
        }

        return false;
    }

    /**
     * Sync task_status_id to legacy status enum based on system_type.
     * Maps: START→TODO, MIDDLE→INPROGRESS, END→COMPLETED
     * OVERDUE returns to TODO (START)
     */
    private function syncTaskStatusToEnum(?string $taskStatusId, string $fallbackStatus): string
    {
        if (!$taskStatusId) {
            // Keep existing status if no task_status_id provided
            return $fallbackStatus;
        }

        $taskStatus = TaskStatus::find($taskStatusId);
        if (!$taskStatus) {
            return $fallbackStatus;
        }

        return match ($taskStatus->system_type) {
            TaskStatusSystemType::START => TaskStatusEnum::TODO->value,
            TaskStatusSystemType::MIDDLE => TaskStatusEnum::INPROGRESS->value,
            TaskStatusSystemType::END => TaskStatusEnum::COMPLETED->value,
            default => TaskStatusEnum::TODO->value, // null system_type defaults to TODO
        };
    }
}
