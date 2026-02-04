<?php

declare(strict_types=1);

namespace App\GraphQL\Validators;

use Nuwave\Lighthouse\Validation\Validator;

class CreateTaskInputValidator extends Validator
{
    public function rules(): array
    {
        return [
            'title'           => ['required', 'string', 'min:1', 'max:255'],
            'organization_id' => [
                'required',
                'uuid',
                'exists:organizations,id',
            ],
            'entity_id'   => ['required', 'uuid'],
            'entity_type' => ['required', 'string', 'in:PULSE'],
            'task_type'   => ['required', 'string', 'in:TASK,LIST,MILESTONE'],
            'description' => ['nullable', 'string'],
            'assignees'   => ['nullable', 'array'],
            'assignees.*' => ['uuid', 'exists:users,id'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'status'      => [
                'nullable',
                'string',
                'in:TODO,INPROGRESS,COMPLETED,OVERDUE',
            ],
            'priority'  => ['nullable', 'string', 'in:URGENT,HIGH,MEDIUM,LOW'],
            'due_date'  => ['nullable', 'string', 'date'],
            'parent_id' => ['nullable', 'uuid', 'exists:tasks,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'           => 'Task title is required',
            'title.min'                => 'Task title cannot be empty',
            'title.max'                => 'Task title cannot exceed 255 characters',
            'organization_id.required' => 'Organization ID is required',
            'organization_id.exists'   => 'The specified organization does not exist',
            'entity_id.required'       => 'Entity ID is required',
            'entity_type.required'     => 'Entity type is required',
            'entity_type.in'           => 'Entity type must be PULSE',
            'task_type.required'       => 'Task type is required',
            'task_type.in'             => 'Task type must be one of: TASK, LIST, or MILESTONE',
            'assignees.*.exists'       => 'One or more assignees do not exist',
            'category_id.exists'       => 'The specified category does not exist',
            'status.in'                => 'Status must be one of: TODO, INPROGRESS, COMPLETED, OVERDUE',
            'priority.in'              => 'Priority must be one of: URGENT, HIGH, MEDIUM, LOW',
            'due_date.date'            => 'Due date must be a valid date',
            'parent_id.exists'         => 'The specified parent task does not exist',
        ];
    }
}
