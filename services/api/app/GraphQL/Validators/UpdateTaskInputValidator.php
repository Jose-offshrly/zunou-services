<?php

declare(strict_types=1);

namespace App\GraphQL\Validators;

use Nuwave\Lighthouse\Validation\Validator;

class UpdateTaskInputValidator extends Validator
{
    public function rules(): array
    {
        return [
            'taskId'          => ['required', 'uuid', 'exists:tasks,id'],
            'title'           => ['required', 'string', 'min:1', 'max:255'],
            'description'     => ['nullable', 'string'],
            'assignees'       => ['nullable', 'array'],
            'assignees.*'     => ['uuid', 'exists:users,id'],
            'category_id'     => ['nullable', 'uuid', 'exists:categories,id'],
            'organization_id' => [
                'required',
                'uuid',
                'exists:organizations,id',
            ],
            'status' => [
                'nullable',
                'string',
                'in:TODO,INPROGRESS,COMPLETED,OVERDUE',
            ],
            'priority'  => ['nullable', 'string', 'in:URGENT,HIGH,MEDIUM,LOW'],
            'due_date'  => ['nullable', 'string', 'date'],
            'start_date' => ['nullable', 'string', 'date'],
            'progress'  => ['nullable', 'string'],
            'color'     => ['nullable', 'string'],
            'parent_id' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'taskId.required'          => 'Task ID is required',
            'taskId.exists'            => 'The specified task does not exist',
            'title.required'           => 'Task title is required',
            'title.min'                => 'Task title cannot be empty',
            'title.max'                => 'Task title cannot exceed 255 characters',
            'organization_id.required' => 'Organization ID is required',
            'organization_id.exists'   => 'The specified organization does not exist',
            'assignees.*.exists'       => 'One or more assignees do not exist',
            'category_id.exists'       => 'The specified category does not exist',
            'status.in'                => 'Status must be one of: TODO, INPROGRESS, COMPLETED, OVERDUE',
            'priority.in'              => 'Priority must be one of: URGENT, HIGH, MEDIUM, LOW',
            'due_date.date'            => 'Due date must be a valid date',
        ];
    }
}
