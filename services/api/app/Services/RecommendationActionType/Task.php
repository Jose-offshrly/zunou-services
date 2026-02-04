<?php

namespace App\Services\RecommendationActionType;

use App\Actions\Task\CreateTaskAction;
use App\Contracts\RecommendationActionTypeInterface;
use App\DataTransferObjects\Task\TaskData;
use App\Enums\TaskType;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\LiveInsightRecommendationAction;
use App\Models\Task as TaskModel;
use App\Services\Agents\Helpers\UpdateTasksHelper;
use App\Services\OpenAIService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Task implements RecommendationActionTypeInterface
{
    const CREATE_TASK = "create";
    const UPDATE_TASK = "update";
    const DELETE_TASK = "delete";
    const VIEW_TASK = "view";

    public function execute(LiveInsightRecommendationAction $action, LiveInsightOutbox $insight): ?array
    {
        if ($action->method == 'create') {
            return $this->create($action);
        }

        if ($action->method == 'update') {
            return $this->update($action);
        }

        if ($action->method == 'delete') {
            return $this->delete($action);
        }

        if ($action->method == 'view') {
            return $this->view($action);
        }

        return null;
    }

    protected function create(LiveInsightRecommendationAction $action): array
    {
        try {
            $data = $action->data;
            $assigneeIds = collect($data['assignees'])->pluck('id')->toArray();
            $data['assignees'] = $assigneeIds;

            // Note: Current code throws error when due date is provided in task data, because "due_date" is expected to be Carbon instance
            $due_date = isset($data['due_date']) ? Carbon::parse($data['due_date']) : null;
            $data["due_date"] = $due_date;

            $entity = $action->recommendation->outboxes()->first()->pulse;

            try {
                $task = resolve(CreateTaskAction::class)->handle(
                    entity: $entity,
                    data: new TaskData(...$data),
                );

                return [
                    'message' => 'Success, You can now view the newly created task in your pulse.',
                    'id' => $task->id,
                ];
            } catch (\Throwable $th) {
                $alreadyExistsMessage = "A task with the same title, type, and parent already exists.";
                if ($th->getMessage() === $alreadyExistsMessage) {
                    $existingTask = $entity
                        ->tasks()
                        ->where([
                            'title'     => $data["title"],
                            'type'      => $data["type"] ?? TaskType::TASK,
                            'parent_id' => $data["parent_id"] ?? null,
                        ])
                        ->first();
                    
                    return [
                        'message' => 'Task already exists. No new entry was created.',
                        'id' => $existingTask->id,
                    ];
                }

                return [
                    'message' => "Something wen't wrong while creating your task",
                    'error' => true
                ];
            }
        } catch (\Throwable $th) {
            Log::error('Failed to create task', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while creating your task",
                'error' => true
            ];
        }
    }

    protected function update(LiveInsightRecommendationAction $action): array
    {
        try {
            $outbox =  $action->recommendation->outboxes()->first();
            $helper  = new UpdateTasksHelper($outbox->organization->id, $outbox->pulse->id);

            $newData = $action->data;

            $task = TaskModel::with(["assignees"])->find($action->data["id"]);
            $allAssignees = $action->data["assignees"] ?? []; // current assignees
            $allAssigneesIds = collect($action->data["assignees"])->pluck("id")->toArray();
            if (empty($allAssignees)) {
               
            } else {
                $assigneesToRemove = $task->assignees->filter(function ($assignee) use ($allAssigneesIds) {
                    return ! in_array($assignee->user_id, $allAssigneesIds);
                });

                // remove assignees not mentioned in new version
                $assigneesToRemove->each(function ($assignee) {
                    Log::debug("Removing " . $assignee->user->name);
                    $assignee->delete();
                });

                unset($newData["remove_assignees"]);
                unset($newData["assignees"]);

                // filter out the existing in the incomming assignees
                $existingIds = $task->assignees->pluck("user_id")->toArray();
    
                $assigneesToAdd = collect($allAssignees)->filter(function ($assignee) use ($existingIds) {
                    return ! in_array($assignee["id"], $existingIds);
                })->toArray();


                $newData["add_assignees"] = $assigneesToAdd;
            }

            $helper->execute([$newData], true); // skip errors

            return [
                'message' => 'Success, You can now view the updated task in your pulse.',
                'id' => $action->data['id'] ?? null,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to update task', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while updating your task",
                'error' => true
            ];
        }
    }

    protected function delete(LiveInsightRecommendationAction $action): array
    {
        try {
            $taskId = $action->data["task_id"];
            TaskModel::destroy([$taskId]);
        
            return [
                'message' => 'Success, the task has been deleted in your pulse.',
                'id' => $taskId,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to to deleted task', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while deleting your task",
                'error' => true
            ];
        }
    }

    protected function view(LiveInsightRecommendationAction $action): array
    {
        try {
            return [
                'message' => 'Success, you can now view your task.',
                'id' => $action->data["task_id"],
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to to view task', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Something wen't wrong while viewing your task",
                'error' => true
            ];
        }
    }

    public static function getClassifications(): array
    {
        return [self::CREATE_TASK, self::UPDATE_TASK, self::DELETE_TASK, self::VIEW_TASK, self::UNSUPPORTED_OPERATION];
    }

    public static function classifyOperation(array $recommendation): string
    {
        $recommendationString = json_encode($recommendation);
        $prompt = <<<EOD
        Refer to the recommendation below. Classify the operation if its the following
        create - for creating new task
        update - for updating existing task (title, assignee, status, priority etc)
        delete - delete task
        view - for viewing or querying tasks
        unsupported_operation - the recommendation neither create, update, delete, view - it is task related but unsupported

        Heres the recommendation:
        {$recommendationString}
        EOD;

        $responseFmt = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'classification_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'classification' => [
                            'type' => 'string',
                            'enum' => [
                                self::CREATE_TASK,
                                self::UPDATE_TASK,
                                self::DELETE_TASK,
                                self::VIEW_TASK,
                                self::UNSUPPORTED_OPERATION,
                            ],
                            'description' => "The classification of the recommendation either create, delete, update or view task",
                        ],
                    ],
                    'required'             => ['classification'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $request = [
            'model' => 'gpt-4.1',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $prompt
                ]
            ],
            'response_format' => $responseFmt
        ];

        $response = OpenAIService::createCompletion($request);
        $assistant = $response['choices'][0]['message'];
        $content = $assistant['content'] ?? '';

        // add error handling
        $decoded = json_decode($content, true);
        return $decoded["classification"];
    }

    public static function getAllowedTools($classification): array
    {
        return match ($classification) {
            default => ['queryTasks', 'searchAssignees', 'searchTasksAndTaskLists', 'getTaskDetails'],
        };
    }

    public static function getOperationPrompt($classification, $recommendation, LiveInsightOutbox $insight): string
    {
        $createTaskPrompt = <<<EOD
            Create task for this recommendation:
                {$recommendation['title']}
                description: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}

            title: (the title of the task)
            description: (the actual description of the created task, what the task is about not the insight description.)
                
            if assignee is mentioned, use the available tool (search assignees) to find the name and id of the person, if return multiple result, pick whoever you think best fit.
            If assignee is mentioned but cannot be found, skip the assignee part leave it empty.

            For parent id leave it null, if explicitly mentioned to add this task in a task list, find that task list if it exists pass the retrieved id, if not found leave it as null.
            
            Execute this recommendation without asking for confirmation,
            Return the task only in json format.
        EOD;

        $updateTaskPrompt = <<<EOD
            Perform update task operation.
            Use this recommendation details for updating the task:
                {$recommendation['title']}
                description: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}

            Instructions when updating task. 

            Pre-requisite.
            It is important to find the task first to be updated. 
            Use "queryTasks" tool and "searchTasksAndTaskLists" to pinpoint the task. This uses text search and similarity search, so pick the most relevant task if the title and description is not exactly the same. DO not ask for confirmation.
            If the task retrieved is completely different from the recommendation, return error true and provide the reasoning. Do not proceed with the update.

            After finding the target task to be updated, compare the current field values with the incomming and see what needed to update. Example status, priority, due date, assignees etc.
            Only then you can start with the update process.

            Keep the values the same as is if not needed to be updated. Only update fields which explicitly mentioned in the recommendation.
            Same with the description field, the description is description of the task, not description of the recommendation.

            Follow these field specific instructions.
                
            if assignee is mentioned to be add, use the available tool (search assignees) to find the name and id of the person, if return multiple result, pick whoever you think best fit.
            If assignee is mentioned but cannot be found, skip the assignee part leave it empty.
            Put the assignees to be add in "add_assignee" field, leave it empty if no mentioned.

            If mentioned to remove someone as assignee from the task, use the available tool (search assignees) to find the name and id of the person and add it in "remove_assignees" field.
            If none mentioned, leave it as empty.

            For operations like removing task from a task list, adding this task to specific task list, Moving this task from different task list.
            Follow this guidelines:
            1. If not mentioned explicitly about task list operation, leave it as empty. Do not provide value
            2. Adding this task to a task list or Moving this task to another task list.
             - step 1: Find the target task list using the available tools. You will get the UUID from the tools.
             - step 2. Assign that uuid as value in "task_list_id"
             - step 3. If target task list cannot be found, skip this field, leave it as empty.
            3. Remove this task from the current task list
             - Set value to "NONE" to explicitly remove this task from the current task list, thus making it in root level.

            Execute this recommendation without asking for confirmation or follow up questions.,
            Return the task only in json format.
        EOD;
        
        $deleteTaskPrompt = <<<EOD
            Perform delete task operation.
            Use this recommendation details for updating the task:
                {$recommendation['title']}
                description: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}

            Pre-requisite.
            It is important to find the task first to be deleted. 
            Use "queryTasks" tool and "searchTasksAndTaskLists" to pinpoint the task. This uses text search and similarity search, so pick the most relevant task if the title and description is not exactly the same. DO not ask for confirmation.
            If the task retrieved is completely different from the target task mentioned in the recommendation, return error true and provide "NOT_FOUND". 

            Execute this delete recommendation without asking for confirmation or follow up questions.,
            Return the id of task to be deleted only. If not found return error instead.
        EOD;

        $viewTaskPrompt = <<<EOD
            View tasks based on this recommendation:
                {$recommendation['title']}
                description: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}

            Use available tools to query and retrieve the tasks.
            Return the tasks in json format.
        EOD;

        return match ($classification) {
            self::CREATE_TASK => $createTaskPrompt,
            self::UPDATE_TASK => $updateTaskPrompt,
            self::DELETE_TASK => $deleteTaskPrompt,
            self::VIEW_TASK => $viewTaskPrompt,
        };
    }

    public static function getOperationSchema($classification): array
    {
        return match ($classification) {
            self::VIEW_TASK => [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'view_task_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            'task_id' => [
                                'type'        => 'string',
                                'description' => 'Task ID that was viewed or reviewed',
                            ],
                        ],
                        'required'             => ['task_id'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
            self::CREATE_TASK => [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'create_task_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
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
                                    'type'       => 'object',
                                    'required'   => ['name', 'id'],
                                    'properties' => [
                                        'id' => [
                                            'type'        => 'string',
                                            'description' => 'The user id of the assignee in db formatted in uuid in database',
                                        ],
                                        'name' => [
                                            'type'        => 'string',
                                            'description' => 'The name of the assignee, either full name (preffered if available) or first name or last name',
                                        ],
                                    ],
                                    'additionalProperties' => false,
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
                            'parent_id' => [
                                'type'        => ['string', 'null'],
                                'description' => 'The UUID of parent task (aka Task List), which must be a task of type "LIST". Null if this task is a top-level task or a task list itself.',
                            ],
                        ],
                        'required'             => ['title', 'description', 'assignees', 'status', 'priority', 'due_date', 'parent_id'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
            self::UPDATE_TASK => [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'update_task_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            "success" => [
                                "type" => "boolean",
                                "description" => "Always true unless the task to update cannot be found.",
                            ],
                            "fail_reason" => [
                                "type" => "string",
                                "enum" => ["TASK_NOT_FOUND", "null"],
                                "description" => "The reason why success is false, only valid reason is Task not found or null if success true"
                            ],
                            "updated_task" => [
                                "type" => "object",
                                "properties" => [
                                    'id' => [
                                        'type'        => 'string',
                                        'description' => 'The unique identifier of the task to update. This should come from database',
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
                                            'additionalProperties' => false,
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
                                            'additionalProperties' => false,
                                        ],
                                    ],
                                ],
                                'required'             => ['id', 'task_list_id', 'title', 'description', 'status', 'priority', 'due_date', 'assign_all_members', 'add_assignees', 'remove_assignees'],
                                'additionalProperties' => false,
                            ],
                        ],
                        'required'             => ['success', 'fail_reason', 'updated_task'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
            self::DELETE_TASK => [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'delete_task_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            "success" => [
                                "type" => "boolean",
                                "description" => "Always true unless the task to delete cannot be found.",
                            ],
                            "fail_reason" => [
                                "type" => "string",
                                "enum" => ["TASK_NOT_FOUND", "null"],
                                "description" => "The reason why success is false, only valid reason is Task not found or null if success true"
                            ],
                            "task_id" => [
                                "type" => "string",
                                "description" => "The unique id (UUID) of the task to be deleted retrieved in the database using query or search tasks tools."
                            ]
                        ],
                        'required'             => ['success', 'fail_reason', 'task_id'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
        };
    }

    public static function saveRecommendation($method, LiveInsightRecommendation $recommendation, LiveInsightOutbox $insight, $input): void
    {
        if (isset($input["error"]) && $input["error"] === true) {
            self::saveFailedRecommendation(
                recommendationId: $recommendation->id,
                user_id: $insight->user_id,
                method: $method,
                errorMessage: "Sorry, something went wrong while carrying out your recommendation.."
            );
            return;
        }

        if ($method === self::CREATE_TASK) {
            $data = [
                "title" => $input['title'],
                "description" => $input['description'] ?? null,
                "category_id" => $input['category_id'] ?? null,
                "organization_id" => $insight->organization_id,
                "status" => $input['status']     ?? null,
                "priority" => $input['priority'] ?? null,
                "due_date" => $input["due_date"] ?? null,
                "type" => TaskType::TASK->value,
                "parent_id" => $input['parent_id'] ?? null,
                "assignees" => $input["assignees"] ?? null,
            ];
        }

        if ($method === self::UPDATE_TASK) {
            if (!$input["success"] || empty($input["updated_task"])) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::UPDATE_TASK,
                    errorMessage: "Task not found. Try editing the task in your pulse instead."
                );
                return;
            }

            $taskId = $input["updated_task"]["id"] ?? null;
            if (!self::existAndValidUUID($taskId)) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::UPDATE_TASK,
                    errorMessage: "Task not found. Try editing the task in your pulse instead."
                );
                return;
            }

            $allAssignees = $input["updated_task"]["add_assignees"] ?? [];
            // $removeAssignees = $input["updated_task"]["remove_assignees"] ?? []; #unsupported
            // $allAssignees = array_merge($addAssignees, $removeAssignees);

            $updatedTasks = $input["updated_task"];
            $updatedTasks["assignees"] = $allAssignees;

            $data = $updatedTasks;
        }

        if ($method === self::DELETE_TASK) {
            $taskId = $input["task_id"] ?? null;
            if (!$input["success"] || !self::existAndValidUUID($taskId)) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::DELETE_TASK,
                    errorMessage: "Task not found. Try editing the task in your pulse instead."
                );
                return;
            }
            $data = ["task_id" => $input["task_id"]];
        }

        if ($method === self::VIEW_TASK) {
            $taskId = $input["task_id"] ?? null;

            if (!self::existAndValidUUID($taskId)) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::VIEW_TASK,
                    errorMessage: "Task not found."
                );
                return;
            }

            $data = ["task_id" => $input["task_id"]];
        }

        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendation->id,
            'user_id' => $insight->user_id,
            'method' => $method,
            'type' => 'task',
            'data' => $data,
        ]);
    }

    private static function saveFailedRecommendation(int $recommendationId, string $user_id, string $method, string $errorMessage, ?array $data = [])
    {
        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendationId,
            'method' => $method,
            'user_id' => $user_id,
            'type' => 'task',
            'data' => $data,
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    private static function existAndValidUUID($id): bool
    {
        $isValid = Str::isUuid($id);
        if (!$isValid) {
            return false;
        }

        return TaskModel::where('id', $id)->exists();
    }
}
