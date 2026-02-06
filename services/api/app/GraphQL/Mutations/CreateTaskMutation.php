<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Task\CreateTaskAction;
use App\Contracts\Taskable;
use App\DataTransferObjects\Task\SourceData;
use App\DataTransferObjects\Task\TaskData;
use App\Models\Pulse;
use App\Models\TaskStatus;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

readonly class CreateTaskMutation
{
    public function __construct(
        private readonly CreateTaskAction $createTaskAction
    ) {
    }

    public function __invoke($_, array $args): Collection
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new Error('no user found!');
            }

            $tasks = [];

            foreach ($args['input'] as $task) {
                $this->validateTaskInput($task);

                $entity = $this->getEntity($task);

                // Validate task_status_id belongs to the pulse
                if (isset($task['task_status_id'])) {
                    $this->validateTaskStatusBelongsToPulse($task['task_status_id'], $entity);
                }

                $source = null;
                if (isset($task['source'])) {
                    $source = new SourceData(
                        type: $task['source']['type'],
                        id: $task['source']['id']
                    );
                }

                $data = new TaskData(
                    title: $task['title'],
                    description: $task['description'] ?? null,
                    assignees: $task['assignees'] ?? null,
                    category_id: !empty($task['category_id'])
                        ? $task['category_id']
                        : null,
                    organization_id: $task['organization_id'],
                    status: $task['status'] ?? null,
                    priority: $task['priority'] ?? null,
                    due_date: isset($task['due_date'])
                        ? Carbon::parse(
                            $task['due_date'],
                            Auth::user()->timezone
                        )->setTimezone('UTC')
                        : null,
                    start_date: isset($task['start_date'])
                        ? Carbon::parse(
                            $task['start_date'],
                            Auth::user()->timezone
                        )->setTimezone('UTC')
                        : null,
                    task_phase_id: $task['task_phase_id'] ?? null,
                    task_status_id: $task['task_status_id'] ?? null,
                    progress: $task['progress'] ?? null,
                    color: $task['color'] ?? null,
                    type: $task['task_type'],
                    parent_id: !empty($task['parent_id'])
                        ? $task['parent_id']
                        : null,
                    source: $source,
                    dependency_task_ids: $task['dependency_task_ids'] ?? null
                );

                $tasks[] = $this->createTaskAction->handle(
                    entity: $entity,
                    data: $data
                );
            }

            return collect($tasks);
        } catch (\Exception $e) {
            throw new Error('Failed to create a task: ' . $e->getMessage());
        }
    }

    private function validateTaskInput(array $task): void
    {
        $validator = Validator::make(
            $task,
            [
                'title' => ['required', 'string', 'min:1', 'max:255'],
                'organization_id' => ['required', 'string'],
                'entity_id' => ['required', 'string'],
                'entity_type' => ['required', 'string'],
                'task_type' => ['required', 'string'],
            ],
            [
                'title.required' => 'Task title is required',
                'title.string' => 'Task title must be a string',
                'title.min' => 'Task title cannot be empty',
                'title.max' => 'Task title cannot exceed 255 characters',
                'organization_id.required' => 'Organization ID is required',
                'entity_id.required' => 'Entity ID is required',
                'entity_type.required' => 'Entity type is required',
                'task_type.required' => 'Task type is required',
            ]
        );

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }

    private function getEntity(array $args): Taskable
    {
        /** @var Taskable $entity */
        $entity = match ($args['entity_type']) {
            'PULSE' => Pulse::find($args['entity_id']),
            default => throw new Error(
                'Entity not supported: ' . $args['entity_type']
            ),
        };

        return $entity;
    }

    private function validateTaskStatusBelongsToPulse(string $taskStatusId, Taskable $entity): void
    {
        if (!($entity instanceof Pulse)) {
            return; // Only validate for Pulse entities
        }

        $taskStatus = TaskStatus::where('id', $taskStatusId)
            ->where('pulse_id', $entity->id)
            ->first();

        if (!$taskStatus) {
            throw new Error('Task status does not belong to the specified pulse.');
        }
    }
}
