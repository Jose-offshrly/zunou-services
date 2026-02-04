<?php

namespace App\Schemas;

class TaskSchema
{
    public const TaskSchema = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'tasks_schema',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'tasks' => [
                        'type'  => 'array',
                        'items' => [
                            'type'     => 'object',
                            'required' => [
                                'title',
                                'description',
                                'status',
                                'priority',
                                'parent_id',
                                'task_type',
                                'assignees',
                                'due_date',
                            ],
                            'additionalProperties' => false,
                            'properties'           => [
                                'title' => [
                                    'type'        => 'string',
                                    'description' => 'Title of the task.',
                                ],
                                'description' => [
                                    'type'        => 'string',
                                    'description' => 'Detailed explanation of what the task is about.',
                                ],
                                'assignees' => [
                                    'type'        => 'array',
                                    'description' => 'The assignees for the task, contains full name and ID of the person assigned to this task.',
                                    'items'       => [
                                        'type'     => 'object',
                                        'required' => [
                                            'id',
                                            'name',
                                            'reasoning',
                                        ],
                                        'additionalProperties' => false,
                                        'properties'           => [
                                            'id' => [
                                                'type'        => 'string',
                                                'description' => 'The user id of the assignee in db. Keet this black if no id given',
                                            ],
                                            'name' => [
                                                'type'        => 'string',
                                                'description' => 'The name of the assignee, either full name (preffered if available) or first name or last name',
                                            ],
                                            'reasoning' => [
                                                'type'        => 'string',
                                                'description' => 'The reasoning behind the assignment of this task to this person.',
                                            ],
                                        ],
                                    ],
                                ],
                                'status' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'TODO',
                                        'INPROGRESS',
                                        'COMPLETED',
                                        'OVERDUE',
                                    ],
                                    'description' => "Current state of the task. Choose from: 'TODO', 'INPROGRESS', 'COMPLETED' or 'OVERDUE'. Default is 'TODO'.",
                                ],
                                'priority' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'URGENT',
                                        'HIGH',
                                        'MEDIUM',
                                        'LOW',
                                    ],
                                    'description' => "The priority level of the tasks. Default is 'LOW'.",
                                ],
                                'due_date' => [
                                    'type'        => 'string',
                                    'description' => 'Deadline for the task in ISO 8601 date format (YYYY-MM-DD), without time.',
                                ],
                                'task_type' => [
                                    'type'        => 'string',
                                    'enum'        => ['TASK', 'LIST'],
                                    'description' => "Type of the task. Task list can be group in a task list. Task with type 'List' can have many 'TASK'. Choose from: 'TASK' or 'LIST'. Default is 'TASK'.",
                                ],
                                'parent_id' => [
                                    'type'        => ['string', 'null'],
                                    'description' => 'UUID of the parent task(task with type "LIST") if this task is a sub-task.',
                                ],
                            ],
                        ],
                    ],
                ],
                'required'             => ['tasks'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];

    public const SimilarityEvalSchema = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'similarity_eval_schema',
            'schema' => [
                'type'                 => 'object',
                'required'             => ['tasks_evaluation'],
                'additionalProperties' => false,
                'properties'           => [
                    'tasks_evaluation' => [
                        'type'  => 'array',
                        'items' => [
                            'type'     => 'object',
                            'required' => [
                                'task_number',
                                'task_id',
                                'title',
                                'retrieved_task_title',
                                'similarity_rating',
                                'is_duplicate',
                                'reason',
                            ],
                            'additionalProperties' => false,
                            'properties'           => [
                                'task_number' => [
                                    'type'        => 'number',
                                    'description' => 'The task_number of the new task. This should be the same as the task_number of the new task.',
                                ],
                                'title' => [
                                    'type'        => 'string',
                                    'description' => 'The title of new task (unchanged)',
                                ],
                                'task_id' => [
                                    'type'        => 'string',
                                    'description' => 'The task_id of the matched task. This should be the same as the task_id of the matched task.',
                                ],
                                'retrieved_task_title' => [
                                    'type'        => 'string',
                                    'description' => 'The title of the retrieved task being compared to the new task. Empty if new task is not a duplicate.',
                                ],
                                'similarity_rating' => [
                                    'type'        => 'number',
                                    'description' => 'A score from 1 to 5 indicating how similar the retrieved task is to the new task. 1 = completely different, 5 = nearly identical.',
                                ],
                                'is_duplicate' => [
                                    'type'        => 'boolean',
                                    'description' => 'Whether the retrieved task is considered a duplicate of the new task.',
                                ],
                                'reason' => [
                                    'type'        => 'string',
                                    'description' => 'A concise explanation of why the task is or isn’t a duplicate, based on functional intent, scope, and task differences.',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'strict' => true,
        ],
    ];

    public const OptionsSchema = [
        'type'       => 'object',
        'properties' => [
            'type' => [
                'type' => 'string',
                'enum' => ['options'],
            ],
            'options' => [
                'type'        => 'array',
                'description' => <<<DESC
A list of relevant task-related entities or system-suggested actions based on the user's query.

Use this when:
- Multiple task records or actionable options match the user’s intent
- The assistant wants to guide the user with **precise next-step task actions**, such as:
    - Assigning a task to someone
    - Marking a task complete
    - Changing task priority or due date
    - Selecting from several possible tasks

These are **based on real system data** or **directly inferable from known context**, not open-ended or imagined suggestions.

When listing tasks, its required to add the type of the task in the option_context. It can be a task or a list.

Each `value` is a short, natural response to the assistant’s message — like something a user would type manually.
DESC
                ,
                'items' => [
                    'type'       => 'object',
                    'properties' => [
                        'label' => [
                            'type'        => 'string',
                            'description' => 'A concise name/title for the task or action being suggested.',
                        ],
                        'suggested_reply' => [
                            'type'        => 'string',
                            'description' => 'A natural-language message that will be auto-filled into the user’s input when selected. It should sound like something a person would naturally type, be specific and task-focused, and directly fulfill the assistant’s current prompt. Avoid including task IDs or UUIDs — users don’t have access to internal system identifiers — and avoid technical commands or vague responses. ✅ Example: "Assign Mark to the \'Update API Docs\' task" ❌ Bad: "Assign 8d731f42-94c3-4e67-bf62-cc75c3b1e58a to Mark".',
                        ],
                        'option_context' => [
                            'type'        => 'object',
                            'description' => 'Additional context used to enrich and distinguish the option in the UI. Includes real data such as assignees, due date, status, and priority for tasks — never invented or abstract.',
                            'properties'  => [
                                'assignees' => [
                                    'type'        => 'string',
                                    'description' => 'Comma-separated list of first names of task assignees. If no assignees, set this to \'unassigned\'.',
                                ],
                                'status' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'Todo',
                                        'In Progress',
                                        'Completed',
                                        'Overdue',
                                    ],
                                    'description' => 'Status of the task. Omit this if no status.',
                                ],
                                'task_type' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'TASK',
                                        'LIST',
                                    ],
                                    'description' => 'Type of the task. Always include this if available.',
                                ],
                            ],
                            'required'             => [],
                            'additionalProperties' => false,
                        ],
                    ],
                    'required' => [
                        'label',
                        'suggested_reply',
                        'option_context',
                    ],
                    'additionalProperties' => false,
                ],
            ],
            'multi_select' => [
                'type'        => 'boolean',
                'description' => 'Allows selecting multiple options if true. Defaults to false.',
            ],
        ],
        'required'             => ['type', 'options', 'multi_select'],
        'additionalProperties' => false,
    ];
}
