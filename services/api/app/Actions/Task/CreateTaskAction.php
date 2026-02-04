<?php

declare(strict_types=1);

namespace App\Actions\Task;

use App\Actions\Assignee\CreateAssigneeAction;
use App\Concerns\FeedHandler;
use App\Contracts\Taskable;
use App\DataTransferObjects\Task\TaskData;
use App\Enums\TaskSource;
use App\Enums\TaskStatus as TaskStatusEnum;
use App\Enums\TaskType;
use App\Helpers\TaskStatusSyncHelper;
use App\Models\DataSource;
use App\Models\Task;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

final class CreateTaskAction
{
    use FeedHandler;

    public function __construct(
        private readonly CreateAssigneeAction $createAssigneeAction,
        private readonly GenerateTaskNumberAction $generateTaskNumberAction
    ) {
    }

    public function handle(Taskable $entity, TaskData $data): Task
    {
        return DB::transaction(function () use ($entity, $data) {
            $existingTask = $entity
                ->tasks()
                ->where([
                    'title' => $data->title,
                    'type' => $data->type ?? TaskType::TASK,
                    'parent_id' => $data->parent_id ?? null,
                ])
                ->first();

            if ($existingTask) {
                throw new Error(
                    'A task with the same title, type, and parent already exists.'
                );
            }

            $taskNumber = $this->generateTaskNumberAction->handle($entity);

            // Enforce consistency between status and task_status_id
            $status = $data->status;
            $taskStatusId = $data->task_status_id;

            // If task_status_id is provided but status is not, derive status from task_status_id
            if ($taskStatusId && !$status) {
                // Status will be synced after creation via helper
                $status = null;
            }
            // If status is provided but task_status_id is not, map status to task_status_id
            elseif ($status && !$taskStatusId) {
                $enumStatus = is_string($status)
                    ? TaskStatusEnum::from($status)
                    : $status;
                $taskStatusId = TaskStatusSyncHelper::getCustomStatusIdForEnum(
                    $enumStatus,
                    $entity->id
                );
            }
            // If both are provided, trust them but will sync after creation

            $task = $entity->tasks()->create([
                'task_number' => $taskNumber,
                'title' => $data->title,
                'type' => $data->type ?? TaskType::TASK,
                'parent_id' => $data->parent_id ?? null,
                'description' => $data->description,
                'category_id' => $data->category_id,
                'organization_id' => $data->organization_id,
                'status' => $status,
                'priority' => $data->priority ?? null,
                'due_date' => $data->due_date,
                'start_date' => $data->start_date,
                'task_phase_id' => $data->task_phase_id,
                'task_status_id' => $taskStatusId,
                'progress' => $data->progress,
                'color' => $data->color,
            ]);

            // Sync status fields to ensure consistency
            if ($taskStatusId) {
                // Derive enum status from custom status (either when status is missing or both are provided)
                TaskStatusSyncHelper::syncCustomStatusToEnum($task);
            }

            if (isset($data->assignees)) {
                $this->assignTask(task: $task, data: $data);
            }

            if (isset($data->source)) {
                Log::info('Task source found');
                $source = match ($data->source->type) {
                    TaskSource::MEETING->value => DataSource::find(
                        $data->source->id
                    ),
                    default => throw new InvalidArgumentException(
                        'Unsupported source type: ' . $data->source->type
                    ),
                };

                $task->source_type = get_class($source);
                $task->source_id = $source->id;
                $task->save();
            }

            if (
                isset($data->dependency_task_ids) &&
                !empty($data->dependency_task_ids)
            ) {
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
            // Check if the task has a parent of type LIST
            if ($task->parent && $task->parent->type === TaskType::LIST) {
                // If it does, only assign one user
                if ($task->assignees->count() > 1) {
                    throw new Error(
                        'Only one user can be assigned to a task under a LIST type parent.'
                    );
                }
            }

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
}
