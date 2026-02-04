<?php

namespace App\Services\Agents\Tools;

class TaskTools
{
    public const createTasks = [
        'type'     => 'function',
        'function' => [
            'name'        => 'createTasks',
            'description' => 'Create Tasks from meeting action items or user defined tasks.',
            'parameters'  => [
                'type'       => 'object',
                'required'   => ['source', 'acknowledgement'],
                'properties' => [
                    'source' => [
                        'type'        => 'string',
                        'enum'        => ['user_defined', 'meeting'],
                        'description' => 'The source of the task items, either user defined or meeting data source.',
                    ],
                    'data_source_id' => [
                        'type'        => 'string',
                        'description' => "The ID of the data source (required if source is 'meeting').",
                    ],
                    'acknowledgement' => [
                        'type'        => 'string',
                        'description' => 'Short confirmation header to inform user that the task is already created. Use this format: "[Meeting Name] Meetings Tasks Created. - [Month Day, Year]". Example: "Team Sync Meetings Tasks Created. - May 7, 2024". Always follow this exact format.',
                    ],
                    'tasks' => [
                        'type'  => 'array',
                        'items' => [
                            'type'        => 'object',
                            'description' => 'A list of tasks to be created. Leave this empty when creating a task list with no specified task.',
                            'required'    => [
                                'title',
                                'description',
                                'status',
                                'priority',
                                'type',
                                'parent_id',
                                'task_type',
                            ],
                            'properties' => [
                                'title' => [
                                    'type'        => 'string',
                                    'description' => 'Title of the task.',
                                ],
                                'description' => [
                                    'type'        => 'string',
                                    'description' => 'Detailed explanation of what the task is about.',
                                ],
                                'is_for_everyone' => [
                                    'type'        => 'boolean',
                                    'description' => 'Set to true **only** if the task is explicitly assigned to all users. If not present, default is false. Do not infer this based on empty or missing assignees. Must be explicitly mentioned to apply to everyone.',
                                ],
                                'assignees' => [
                                    'type'        => 'array',
                                    'description' => 'The assignees for the task, contains full name and ID of the person assigned to this task.',
                                    'items'       => [
                                        'type'       => 'object',
                                        'required'   => ['name'],
                                        'properties' => [
                                            'id' => [
                                                'type'        => 'string',
                                                'description' => 'The user id of the assignee in db.',
                                            ],
                                            'name' => [
                                                'type'        => 'string',
                                                'description' => 'The name of the assignee, either full name (preffered if available) or first name or last name',
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
                                    'format'      => 'date-time',
                                    'description' => 'Deadline for the task in ISO 8601 format (e.g., 2025-04-04 15:00:00).',
                                ],
                                'task_type' => [
                                    'type'        => 'string',
                                    'enum'        => ['TASK'],
                                    'description' => "Type of the task. Default is 'TASK'.",
                                ],
                                'parent_id' => [
                                    'type'        => ['string', 'null'],
                                    'description' => 'The UUID of parent task (aka Task List), which must be a task of type "LIST". Null if this task is a top-level task or a task list itself.',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];

    public const createTaskList = [
        'type'     => 'function',
        'function' => [
            'name'        => 'createTaskList',
            'description' => 'Creates a new task list with the given title and description. Make sure search the task list first and confirm that it does not exist before creating a new one. Strictly no duplicates for task list.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'title' => [
                        'type'        => 'string',
                        'description' => 'The core name of the task list to create or retrieve, excluding generic suffixes like "task list" or "task lists". For example, from "add this to our sales task list", extract "sales" as the title.',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'An optional description for the task list. Used only when creating a new list.',
                    ],
                    'checked_existence' => [
                        'type'        => 'boolean',
                        'description' => 'Whether you already called searchTasksAndTaskLists or queryTaskstool to check if the task list already exists.',
                    ],
                ],
                'required'             => ['title', 'checked_existence'],
                'additionalProperties' => false,
            ],
        ],
    ];

    public const communicateWithOtherAgents = [
        'type'     => 'function',
        'function' => [
            'name'        => 'communicateWithOtherAgents',
            'description' => 'Request information from another agent to fulfill user queries that require data from multiple sources. Specify the target agent, details of the request, and the expected data format.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'target_agent' => [
                        'type'        => 'string',
                        'enum'        => ['OrgChart Agent'],
                        'description' => "The agent to query. Example: 'OrgChart Agent'.",
                    ],
                    'request' => [
                        'type'        => 'string',
                        'description' => "The specific information or action needed from the target agent. For example: 'Get details for member named John Doe.'",
                    ],
                    'expected_data' => [
                        'type'        => 'string',
                        'description' => "The format or type of data expected in response. Example: 'member name and id'.",
                    ],
                ],
                'required'             => ['target_agent', 'request', 'expected_data'],
                'additionalProperties' => false,
            ],
        ],
    ];

    public const saveTask = [
        'type'     => 'function',
        'function' => [
            'name'        => 'saveTask',
            'description' => 'Save a task to Database',
            'parameters'  => [
                'properties' => [
                    'tasks' => [
                        'items' => [
                            'properties' => [
                                'name' => [
                                    'description' => 'The name of the task',
                                    'type'        => 'string',
                                ],
                                'description' => [
                                    'description' => 'The description of the task',
                                    'type'        => 'string',
                                ],
                            ],
                            'required' => ['name', 'description'],
                            'type'     => 'object',
                        ],
                        'type' => 'array',
                    ],
                ],
                'required' => ['tasks'],
                'type'     => 'object',
            ],
        ],
    ];

    public const getTaskDetails = [
        'type'     => 'function',
        'function' => [
            'name'        => 'getTaskDetails',
            'description' => 'Retrieve details of a specific task or an entire task list including sub-tasks',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'id' => [
                        'description' => 'The ID (formatted as UUID) of the task or task list to fetch. Get these on returned tasks of other tools like `searchTasks`. DO not provide invalid ID.',
                        'type'        => 'string',
                    ],
                    'type' => [
                        'description' => 'Whether the ID refers to a single "task" or a "task_list"',
                        'type'        => 'string',
                        'enum'        => ['task', 'task_list'],
                    ],
                ],
                'required' => ['id', 'type'],
            ],
        ],
    ];

    public const searchTasksAndTaskLists = [
        'type'     => 'function',
        'function' => [
            'name'        => 'searchTasksAndTaskLists',
            'description' => 'Search for tasks and task lists by title or description',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'query' => [
                        'description' => 'Search keyword to match against task titles or descriptions',
                        'type'        => 'string',
                    ],
                ],
                'required' => ['query'],
            ],
        ],
    ];

    public const searchAssignees = [
        'type'     => 'function',
        'function' => [
            'name'        => 'searchAssignees',
            'description' => 'Search for assignees by name',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'name' => [
                        'description' => 'Search keyword to match against assignee names. Do not provide invalid name. It can be first name, lastname or full name.',
                        'type'        => 'string',
                    ],
                ],
                'required' => ['name'],
            ],
        ],
    ];

    public const queryTasks = [
        'type'     => 'function',
        'function' => [
            'name'        => 'queryTasks',
            'description' => 'Query database for tasks and task lists. Task and Task list have similar structure the difference is that task list have type "LIST" and task have type "TASK".',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'task_query_kind' => [
                        'type'        => 'string',
                        'enum'        => ['TASK_LIST', 'TASK', 'BOTH'],
                        'description' => 'The kind of entity to retrieved. Default is "TASK" unless specified otherwise.',
                    ],
                    'status' => [
                        'description' => 'Filter tasks by multiple statuses',
                        'type'        => 'array',
                        'items'       => [
                            'type' => 'string',
                            'enum' => ['TODO', 'INPROGRESS', 'COMPLETED', 'OVERDUE'],
                        ],
                        'uniqueItems' => true,
                    ],
                    'assignee_id' => [
                        'description' => 'Filter tasks by assignee ID. Provide valid assignee ID from the database. Set the value to "UNASSIGNED" to query unassigned tasks.',
                        'type'        => 'string',
                    ],
                    'priority' => [
                        'description' => 'Filter tasks by priority',
                        'type'        => 'string',
                        'enum'        => ['URGENT', 'HIGH', 'MEDIUM', 'LOW'],
                    ],
                    'due_date' => [
                        'description' => 'Filter tasks by due date',
                        'type'        => 'string',
                        'format'      => 'date',
                    ],
                    'due_date_range' => [
                        'description' => 'Filter tasks by due date range',
                        'type'        => 'object',
                        'properties'  => [
                            'from' => [
                                'description' => 'Filter tasks by due date from',
                                'type'        => 'string',
                                'format'      => 'date',
                            ],
                            'to' => [
                                'description' => 'Filter tasks by due date to',
                                'type'        => 'string',
                                'format'      => 'date',
                            ],
                        ],
                        'required' => ['from', 'to'],
                    ],
                    'order_by' => [
                        'description' => 'Sort tasks by column',
                        'type'        => 'string',
                        'enum'        => ['TITLE', 'PRIORITY', 'STATUS'],
                    ],
                    'created_at' => [
                        'description' => 'Filter tasks by created at. Use this when user asks for tasks created in a specific date range.',
                        'type'        => 'object',
                        'properties'  => [
                            'from' => [
                                'description' => 'Filter tasks by created at from',
                                'type'        => 'string',
                                'format'      => 'date-time',
                            ],
                            'to' => [
                                'description' => 'Filter tasks by created at to.',
                                'type'        => 'string',
                                'format'      => 'date-time',
                            ],
                        ],
                        'required' => ['from', 'to'],
                    ],
                    'updated_at' => [
                        'description' => 'Filter tasks by updated at. Use this filter to know what tasks are updated in a specific date range.',
                        'type'        => 'object',
                        'properties'  => [
                            'from' => [
                                'description' => 'Filter tasks by updated at from',
                                'type'        => 'string',
                                'format'      => 'date-time',
                            ],
                            'to' => [
                                'description' => 'Filter tasks by updated at to.',
                                'type'        => 'string',
                                'format'      => 'date-time',
                            ],
                        ],
                        'required' => ['from', 'to'],
                    ],
                    'task_list_id' => [
                        'description' => 'Filter tasks by task list id. Provide valid task list id from the database.',
                        'type'        => 'string',
                    ],
                ],
                'required' => [],
                'additionalProperties' => false,
            ],
        ],
    ];

    public const queryDatabase = [
        'type'     => 'function',
        'function' => [
            'name'        => 'queryDatabase',
            'description' => 'Query database',
            'parameters'  => [
                'type'                 => 'object',
                'required'             => ['model', 'query_operation', 'task_query_kind'],
                'additionalProperties' => false,
                'properties'           => [
                    'query_operation' => [
                        'type'        => 'string',
                        'enum'        => ['SELECT'],
                        'description' => 'This tool can perform select queries only in database.',
                    ],
                    'task_query_kind' => [
                        'type'        => ['string', 'null'],
                        'enum'        => ['TASK_LIST', 'TASK', 'BOTH'],
                        'description' => 'The kind of entity to retrieved. Only applicable for task model. Default is "TASK" unless specified otherwise.',
                    ],
                    'model' => [
                        'type'        => 'string',
                        'enum'        => ['Task', 'User'],
                        'description' => "The root model to query. Must be one of: 'Task', or 'User'.",
                    ],
                    'columns' => [
                        'type'        => 'array',
                        'items'       => ['type' => 'string'],
                        'description' => 'Columns of the root model to select. If empty or omitted, all safe columns are selected. Do NOT use entity_type.',
                    ],
                    'filters' => [
                        'type'        => 'array',
                        'description' => 'Filters to apply. For root filters: provide "column", "operator", and "value". For relation filters: also provide "relation". Do NOT use or filter on entity_type (this is handled for you automatically when relevant). Operators are strictly: =, !=, <, >, <=, >=, LIKE, IN.',
                        'items'       => [
                            'type'        => 'object',
                            'description' => 'Filter on root model or on a first-level related model. Do NOT use dot notation or entity_type.',
                            'properties'  => [
                                'column' => [
                                    'type'        => 'string',
                                    'description' => 'Column name on root or related model (never entity_type).',
                                ],
                                'relation' => [
                                    'type'        => 'string',
                                    'description' => 'The model relation to filter on (Eloquent relation name).',
                                ],
                                'operator' => [
                                    'type' => 'string',
                                    'enum' => [
                                        '=',
                                        '!=',
                                        '<',
                                        '>',
                                        '<=',
                                        '>=',
                                        'LIKE',
                                        'IN',
                                    ],
                                    'description' => 'Comparison operator. Use IN for arrays.',
                                ],
                                'value' => [
                                    'description' => "The filter value. If using 'IN', must be an array; else, a scalar (string, int, etc).",
                                ],
                            ],
                            'required' => ['operator', 'value'],
                            'oneOf'    => [
                                ['required' => ['column']],
                                ['required' => ['relation', 'column']],
                            ],
                            'additionalProperties' => false,
                        ],
                    ],
                    'joins' => [
                        'type'        => 'array',
                        'description' => "Relations to eager load (relation: string). For aggregates, also provide aggregate (one of 'count', 'max', 'min', 'avg', 'sum'), select (array with column name(s)), and optional 'as' (alias for aggregate result). Only allowed first-level relations: Task ['assignees','parent','subtasks'], User ['assignees', 'tasks'], Assignee ['user','entity']. When joining assignees, entity_type = 'App\\Models\\Task' is handled automatically.",
                        'items'       => [
                            'type'                 => 'object',
                            'required'             => ['relation'],
                            'additionalProperties' => false,
                            'properties'           => [
                                'relation' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'assignees.user',
                                        'parent',
                                        'children',
                                    ],
                                    'description' => 'Name of the relation to eager load or aggregate.',
                                ],
                                'select' => [
                                    'type'        => 'array',
                                    'items'       => ['type' => 'string'],
                                    'description' => 'Columns from related model to aggregate on (for aggregate joins).',
                                ],
                                'aggregate' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'count',
                                        'max',
                                        'min',
                                        'avg',
                                        'sum',
                                    ],
                                    'description' => 'Aggregate function for related records, if any.',
                                ],
                                'as' => [
                                    'type'        => 'string',
                                    'description' => 'Alias for aggregate result column (optional).',
                                ],
                            ],
                        ],
                    ],
                    'aggregate' => [
                        'type'        => 'object',
                        'description' => 'Optional aggregate on the root model.',
                        'properties'  => [
                            'function' => [
                                'type'        => 'string',
                                'enum'        => ['count', 'max', 'min', 'avg', 'sum'],
                                'description' => 'Aggregate function to apply.',
                            ],
                            'column' => [
                                'type'        => 'string',
                                'description' => 'Column of the root model to aggregate on.',
                            ],
                            'as' => [
                                'type'        => 'string',
                                'description' => 'Alias for the aggregate result.',
                            ],
                        ],
                        'required'             => ['function', 'column'],
                        'additionalProperties' => false,
                    ],
                    'order_by' => [
                        'type'        => 'array',
                        'description' => 'Sorting: list of root model columns and directions.',
                        'items'       => [
                            'type'                 => 'object',
                            'required'             => ['column'],
                            'additionalProperties' => false,
                            'properties'           => [
                                'column'    => ['type' => 'string'],
                                'direction' => [
                                    'type' => 'string',
                                    'enum' => ['asc', 'desc'],
                                ],
                            ],
                        ],
                    ],
                    'limit' => [
                        'type'        => 'integer',
                        'minimum'     => 1,
                        'maximum'     => 100,
                        'description' => 'Maximum number of results to return (default 50).',
                    ],
                ],
            ],
        ],
    ];

    public const updateTasks = [
        'type'     => 'function',
        'function' => [
            'name'        => 'updateTasks',
            'description' => "Updates one or more existing tasks by modifying fields such as title, description, status, due date, or priority. Specify the task's unique identifier and any fields you wish to update; all other fields will remain unchanged. Use this tool to efficiently manage multiple task updates in a single request.",
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'tasks' => [
                        'type'        => 'array',
                        'description' => 'A list of tasks to update.',
                        'items'       => [
                            'type'       => 'object',
                            'required'   => ['id'],
                            'properties' => [
                                'id' => [
                                    'type'        => 'string',
                                    'description' => 'The unique identifier of the task to update.',
                                ],
                                'task_list_id' => [
                                    'type'        => 'string',
                                    'description' => 'The unique identifier of the task list. Use this to move the task to a different task list, or move the independent task to a task list. Set the value to "NONE" to move the task to a top-level, basically remove it from a task list. Do not provide this argument if not explicitly mentioned adding or removing task to a task list.',
                                ],
                                'title' => [
                                    'type'        => 'string',
                                    'description' => 'The updated title of the task.',
                                ],
                                'description' => [
                                    'type'        => 'string',
                                    'description' => 'The updated description of the task.',
                                ],
                                'status' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'TODO',
                                        'INPROGRESS',
                                        'COMPLETED',
                                        'OVERDUE',
                                    ],
                                    'description' => 'The updated status of the task.',
                                ],
                                'due_date' => [
                                    'type'        => 'string',
                                    'format'      => 'date',
                                    'description' => 'The updated due date of the task (YYYY-MM-DD).',
                                ],
                                'priority' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'URGENT',
                                        'HIGH',
                                        'MEDIUM',
                                        'LOW',
                                    ],
                                    'description' => 'The updated priority of the task.',
                                ],
                                'assign_all_members' => [
                                    'type'        => 'boolean',
                                    'description' => 'Set to true **only** if the task is explicitly assigned to all users. If not present, default is false. Do not infer this based on empty or missing assignees. Must be explicitly mentioned to apply to everyone.',
                                ],
                                'add_assignees' => [
                                    'type'  => 'array',
                                    'items' => [
                                        'type'        => 'object',
                                        'description' => 'One or more members to be assigned on the task',
                                        'properties'  => [
                                            'id' => [
                                                'type'        => 'string',
                                                'description' => 'The id of the user',
                                            ],
                                            'name' => [
                                                'type'        => 'string',
                                                'description' => 'The name of the user',
                                            ],
                                        ],
                                        'required'              => ['id', 'name'],
                                        'additional_properties' => false,
                                    ],
                                ],
                                'remove_assignees' => [
                                    'type'  => 'array',
                                    'items' => [
                                        'type'        => 'object',
                                        'description' => 'One or more member to be unassigned on the task.',
                                        'properties'  => [
                                            'id' => [
                                                'type'        => 'string',
                                                'description' => 'The id of the user',
                                            ],
                                            'name' => [
                                                'type'        => 'string',
                                                'description' => 'The name of the user',
                                            ],
                                        ],
                                        'required'              => ['id', 'name'],
                                        'additional_properties' => false,
                                    ],
                                ],
                            ],
                            'additionalProperties' => false,
                            'minProperties'        => 2,
                        ],
                    ],
                ],
                'required'             => ['tasks'],
                'additionalProperties' => false,
            ],
        ],
    ];

    public const deleteTask = [
        'type'     => 'function',
        'function' => [
            'name'        => 'deleteTask',
            'description' => 'Delete an existing task(s) in the database.',
            'parameters'  => [
                'type'       => 'object',
                'required'   => ['ids', 'confirmed'],
                'properties' => [
                    'ids' => [
                        'type'        => 'array',
                        'description' => 'The ids of the tasks.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'confirmed' => [
                        'type'        => 'boolean',
                        'description' => 'Must be true only if the agent already asked the user “Are you sure you want to delete this task?” and the user explicitly confirmed. Do not call this function immediately after the user requests deletion. The agent must ask for confirmation first.',
                    ],
                ],
                'additionalProperties' => false,
            ],
        ],
    ];
}
