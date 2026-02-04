<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Task\UpdateTaskAction;
use App\DataTransferObjects\Task\TaskData;
use App\Models\Task;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

readonly class UpdateTaskMutation
{
    public function __construct(
        private readonly UpdateTaskAction $updateTaskAction
    ) {
    }

    public function __invoke($_, array $args)
    {
        try {
            $this->validateInput($args);

            $task = Task::find($args['taskId']);
            if (!$task) {
                throw new Error('Task not found!');
            }

            $data = new TaskData(
                title: $args['title'],
                description: $args['description'] ?? null,
                assignees: $args['assignees'] ?? null,
                category_id: !empty($args['category_id'])
                    ? $args['category_id']
                    : null,
                organization_id: $args['organization_id'],
                status: $args['status'] ?? $task->status->value,
                priority: $args['priority'] ?? null,
                due_date: isset($args['due_date'])
                    ? Carbon::parse(
                        $args['due_date'],
                        Auth::user()->timezone
                    )->setTimezone('UTC')
                    : null,
                start_date: isset($args['start_date'])
                    ? Carbon::parse(
                        $args['start_date'],
                        Auth::user()->timezone
                    )->setTimezone('UTC')
                    : null,
                task_phase_id: $args['task_phase_id'] ?? null,
                task_status_id: $args['task_status_id'] ?? null,
                progress: $args['progress'] ?? null,
                color: $args['color'] ?? null,
                parent_id: !empty($args['parent_id'])
                    ? $args['parent_id']
                    : null,
                type: $task->type->value,
                dependency_task_ids: $args['dependency_task_ids'] ?? null
            );

            Log::info('Task Data: ', $data->all());

            return $this->updateTaskAction->handle($task, $data);
        } catch (\Exception $e) {
            Log::info('Error:' . $e->getMessage());
            throw new Error('Failed to update task' . $e->getMessage());
        }
    }

    private function validateInput(array $args): void
    {
        $validator = Validator::make(
            $args,
            [
                'taskId' => ['required', 'string', 'exists:tasks,id'],
                'title' => ['required', 'string', 'min:1', 'max:255'],
                'organization_id' => ['required', 'string'],
            ],
            [
                'taskId.required' => 'Task ID is required',
                'taskId.exists' => 'The specified task does not exist',
                'title.required' => 'Task title is required',
                'title.string' => 'Task title must be a string',
                'title.min' => 'Task title cannot be empty',
                'title.max' => 'Task title cannot exceed 255 characters',
                'organization_id.required' => 'Organization ID is required',
            ]
        );

        if ($validator->fails()) {
            throw new Error($validator->errors()->first());
        }
    }
}
