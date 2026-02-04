<?php

namespace App\Services\Agents\Helpers;

use App\Models\Task;
use App\Services\Agents\Shared\TaskPipeline;
use Carbon\Carbon;
use Ramsey\Uuid\Uuid;

class UpdateTasksHelper
{
    protected TaskPipeline $taskPipeline;

    public function __construct(string $organizationId, string $pulseId)
    {
        $this->taskPipeline = new TaskPipeline($organizationId, $pulseId);
    }

    public function execute($tasks, ?bool $skip_errors = false)
    {
        $success = [];
        $errors  = [];

        foreach ($tasks as $task) {
            if (empty($task['id']) || ! Uuid::isValid($task['id'])) {
                $errors[] = [
                    'task'  => $task,
                    'error' => 'Invalid task id should be valid uuid and must exists in task list',
                ];
                continue;
            }

            $taskId = $task['id'];

            $taskDB = Task::find($taskId);
            if (! $taskDB) {
                $errors[] = [
                    'task'  => $task,
                    'error' => 'Task id is invalid, no records with that given id',
                ];
                continue;
            }

            if (! empty($task['due_date'])) {
                $dueDate = $this->processDueDate($task['due_date']);
                if (is_null($dueDate)) {
                    $errors[] = [
                        'task'  => $task,
                        'error' => "Invalid due date: {$task['due_date']}",
                    ];
                    if ($skip_errors) {
                        unset($task['due_date']);
                    } else {
                        continue;
                    }
                } else {
                    $task['due_date'] = $dueDate;
                }
            }

            $shouldAssignAllMembers = isset($task['assign_all_members']) && $task['assign_all_members'] == true;

            if ($shouldAssignAllMembers) {
                $hydratedAddAssignee   = $this->taskPipeline->assignAllMembersToTask();
                $task['add_assignees'] = $hydratedAddAssignee;
            }

            if (! empty($task['add_assignees']) && ! $shouldAssignAllMembers) {
                $hydratedAddAssignee = $this->taskPipeline->hydrateAssignee([
                    'assignees' => $task['add_assignees'],
                ]);
                if (
                    empty($hydratedAddAssignee) || count($hydratedAddAssignee) !== count($task['add_assignees'])
                ) {
                    // invalid member details passed, abort
                    $errors[] = [
                        'task'  => $task,
                        'error' => 'Assignee record not found, Make sure to pass valid member id and name for assignee',
                    ];
                    if ($skip_errors) {
                        unset($task['add_assignees']);
                    } else {
                        continue;
                    }
                } else {
                    $task['add_assignees'] = $hydratedAddAssignee;
                }
            }

            if (! empty($task['remove_assignees'])) {
                $hydratedRemoveAssignee = $this->taskPipeline->hydrateAssignee([
                    'assignees' => $task['remove_assignees'],
                ]);
                if (
                    empty($hydratedRemoveAssignee) || count($hydratedRemoveAssignee) !== count($task['remove_assignees'])
                ) {
                    // invalid member details passed, abort
                    $errors[] = [
                        'task'  => $task,
                        'error' => 'Assignee with name record not found, Make sure to pass valid member id and name for assignee',
                    ];
                    if ($skip_errors) {
                        unset($task['remove_assignees']);
                    } else {
                        continue;
                    }
                } else {
                    $task['remove_assignees'] = $hydratedRemoveAssignee;
                }
            }

            $isDirty = false;
            $validatedTaskListIds = [];
            foreach ($task as $key => $value) {
                if ($key === 'due_date' && ! empty($value)) {
                    $taskDB->due_date = $dueDate;
                    $isDirty          = true;
                    continue;
                }

                if ($key === 'task_list_id' && ! empty($value)) {
                    if ($value === 'NONE') {
                        $taskDB->parent_id = null;
                    } else {
                        try {
                            if (! in_array($value, $validatedTaskListIds)) {
                                Task::findOrFail($value);
                                $validatedTaskListIds[] = $value;
                            }
                            $taskDB->parent_id = $value;
                        } catch (\Throwable $th) {
                            $errors[] = [
                                'task'  => $task,
                                'error' => "Invalid task list id: {$value}, Make sure to pass valid task list id",
                            ];
                            continue;
                        }
                    }
                    $isDirty = true;
                    continue;
                }

                if (
                    ! in_array($key, [
                        'add_assignees',
                        'remove_assignees',
                        'assign_all_members',
                    ]) && ! empty($value)
                ) {
                    $taskDB->$key = $value;
                    $isDirty      = true;
                    continue;
                }
            }

            if ($isDirty) {
                $taskDB->save();
            }

            if (isset($hydratedAddAssignee)) {
                $this->addAssignees($taskDB, $hydratedAddAssignee);
            }

            if (isset($hydratedRemoveAssignee)) {
                $this->removeAssignees($taskDB, $hydratedRemoveAssignee);
            }

            $success[] = $task;
        }

        return [
            'errors'  => $errors,
            'success' => $success,
        ];
    }

    public function validateAssignees($assignees)
    {
        $valid   = [];
        $invalid = [];

        foreach ($assignees as $assignee) {
            if (empty($assignee['id'])) {
                $invalid[] = [
                    'assignee' => $assignee,
                    'error'    => 'Assignee id should be a valid UUID and should exist in database',
                ];
                continue;
            }
            $valid[] = $assignee;
        }

        return [
            'valid'   => $valid,
            'invalid' => $invalid,
        ];
    }

    public function addAssignees(Task $task, array $assignees)
    {
        foreach ($assignees as $assigneeData) {
            $exists = $task
                ->assignees()
                ->where('user_id', $assigneeData['id'])
                ->exists();

            if (! $exists) {
                $task->assignees()->create([
                    'user_id' => $assigneeData['id'],
                ]);
            }
        }
    }

    public function removeAssignees(Task $task, array $assignees)
    {
        foreach ($assignees as $assigneeData) {
            $task
                ->assignees()
                ->where('user_id', $assigneeData['id'])
                ->delete();
        }
    }

    public function setAssignees(Task $task, array $assignees)
    {
        $task->assignees()->delete();

        foreach ($assignees as $assigneeData) {
            $task->assignees()->create([
                'user_id' => $assigneeData['id'],
            ]);
        }
    }

    protected function processDueDate($dueDate)
    {
        if (empty($dueDate)) {
            return null;
        }

        try {
            return Carbon::parse($dueDate)->toDateString();
        } catch (\Exception $e) {
            return null;
        }
    }
}
