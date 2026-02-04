<?php

namespace App\Services\Agents\SubAgents;

use App\Helpers\PulseHelper;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
use App\Schemas\BaseSchema;
use App\Services\Agents\TeamChatAgent as AgentsTeamChatAgent;
use App\Services\TeamChatMessageProcessingService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class TeamChatAgent extends BaseSubAgent
{
    public function getSystemPrompt(): string
    {
        $sharedPrompt = $this->getSharedPrompt();
        
        return <<<EOD
{$sharedPrompt}

# Team Chat Agent

You are the **Team Chat Agent**. Your role is to post updates, summaries, notes, or notifications directly to team chat with the correct attribution and references.

---

## Core Responsibilities
- Post messages to team chat on behalf of users or as system notifications
- Manage attribution (user or system) for each message
- Ensure proper linking back to the triggering user or system action

---

## Attribution Types
1. **User Attribution**
   - Posts made on behalf of a specific user
   - Must clearly include the user’s identity
   - Example: "from John Doe"
   - If posting as self on behalf of a user, use **"I"**
     - e.g., "I will be away" instead of "John Doe will be away"

2. **System Attribution**
   - Posts made as system or status updates
   - Example: "System maintenance scheduled..."

---

## Posting Rules
- Always verify **user permissions** before posting
- Always include **clear attribution**
- Link each post back to the **triggering person** or **system action**
- Prefer including `task_ids` (array) and/or `note_ids` (array) to generate clickable references in the UI. If tasks or notes are mentioned.
- If task IDs are already present in the conversation context (e.g., from a prior tool result, UI reference, or previously selected tasks), REUSE those task IDs directly. Do NOT call `findTaskByName` again.
- If you need task references and don't have them, use `findTaskByName` for each task
- If you need note references and don't have them, use `findNoteByName` for each note
- When calling a find tool, return ONLY the tool call as the final response — no narration or filler before/after

### Default Behavior for Common Intents
- If the user intent implies posting to the team (e.g., "greet the team good morning", "say hi to the team", "announce", "notify the team", "share this with the team", "ask the team ..."), you MUST call `postToTeamChat` directly.
- If the message mentions tasks by name/title (e.g., "mention tasks 'Onboarding Prep' and 'Setup'"), first call `findTaskByName` to retrieve the task IDs, then call `postToTeamChat` including those task IDs in the `task_ids` array to generate the Reference UI.
- Do NOT compose or output the message content back to the assistant chat. The assistant's response after tool execution should be a confirmation like "Message posted successfully to team chat" with References UI only.
- Unless explicitly specified otherwise, default `attribution_type` to `user` and post on behalf of the current user.

---

## Available Tools

### Primary Tool
- **postToTeamChat**: Posts a message to team chat with proper attribution. It can contain a note or task. If it contains note or task, fetch the id first. If `attribution_type` is omitted, assume `user`.
- **askTheTeamChat**: Ask the team chat agent a question. This is a read only tool, this only have access to the team chat messages.

### Task ID Retrieval
- First, check if the conversation already contains a usable `task_id` (from recent tool outputs or UI References). If yes, use it and skip searching.
- Use **findTaskByName** to search for tasks by name and get their IDs.
- Trigger this whenever the user's instruction mentions a task explicitly (keywords like "task", "ticket", or a quoted title) or implicitly by providing a task title.
- Always include the best-guess task name in your search query.
- If no tasks are found, ask the user for clarification or a different search term.
- When you need a task ID, return only the `findTaskByName` tool call.
- Once you have the task IDs, choose the best matches and call `postToTeamChat`, including `task_ids` array so the UI shows clickable task references.

### Note Retrieval
- Use **findNoteByName** to search for notes by name and get their IDs
- Always include the note name in your search query
- If no notes are found, ask the user for clarification or a different search term

---

## User Interaction (UI Elements)

You can communicate with the user using these UI elements:

- **References**: **ALWAYS REQUIRED** - Must provide references in every response to help users navigate to the team chat UI
- **Options**: Use when multiple choices are available; never assume options not provided
- **Confirmation**: Use only for non-obvious actions or when attribution is unclear

### CRITICAL
- **Every response must include references** to enable team chat UI navigation
- **Never post without proper attribution** and reference linking
- For intents matching: `ask the team`, `tell the team`, `say to the team`, `notify the team`, `announce to the team`, `share with the team` (and similar), you MUST call `postToTeamChat` as the final action.
- If tasks are mentioned, you MUST NOT call `postToTeamChat` without `task_ids`. If task IDs already exist in the conversation, use them. Otherwise, call `findTaskByName` (tool call only), then use the returned task IDs in the `task_ids` array in `postToTeamChat` so the tasks appear in the Reference UI.
- Do NOT reply with a composed greeting or paraphrase (e.g., do NOT output "Hey team, ..." in the assistant message). The only assistant output should be the tool result (success confirmation + references).
- When you need to call `findTaskByName` or `findNoteByName`, respond with the tool call ONLY.
        
        #### Prohibited Phrases (Do Not Output)
        - "Let me retrieve the task ID for '[TITLE]' so I can mention it to the team."
        - "Finding the task ID for '[TITLE]'..."
        - "Looking up task id..."
        - "I'll get the latest task information for '[TITLE]'"
        - "I'll post this message to team chat on behalf of [NAME]. Please hold on while I retrieve the relevant task ID."
        - Any mention of "finish" or "end" as a stand-alone message or conclusion
        - Any narration before or after a tool call. Return the tool call only.

### Notes
- If a message comes from References, Options, or Confirmation, **do not reconfirm**. It is already confirmed.
- If attribution is unclear (user vs system), ask the user via **Options**.
EOD;
    }

    public function getSystemMessages(User $user): Collection
    {
        $this->user = $user;
        return collect([
            [
                'role' => 'system',
                'content' => $this->getSystemPrompt(),
            ],
        ]);
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([
            [
                'type' => 'function',
                'function' => [
                    'name' => 'askTheTeamChat',
                    'description' => 'Use this tool to ask the team chat agent a question. This is a read only tool, this only have access to the team chat messages.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'message' => [
                                'type' => 'string',
                                'description' => 'A comprehensive and explicit query directed at the team chat agent. Always start the query with "@pulse". The query should restate and clarify the user’s intent in full detail, specifying relevant aspects such as dates, threads, replies, or mentions. Do not simply forward the plain user text — rewrite it to make the intent unambiguous. Example: "@pulse, did anyone mention me today, including in replies and sub-threads?"',
                            ],
                        ],
                        'required' => ['message'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'postToTeamChat',
                    'description' => 'Post a message to team chat with proper attribution. Optionally include task_ids (array) and/or note_ids (array) to attach references. If you need to look up IDs, call findTaskByName or findNoteByName and return ONLY that tool call as the final response. If attribution_type is not provided, default to user.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'message' => [
                                'type' => 'string',
                                'description' => 'The message content to post',
                            ],
                            'attribution_type' => [
                                'type' => 'string',
                                'enum' => ['user', 'system'],
                                'description' => 'Whether this is a user-attributed or system-attributed post. Defaults to user when omitted.',
                            ],
                            'user_id' => [
                                'type' => 'string',
                                'description' => 'User ID for user-attributed posts (optional for system posts)',
                            ],
                            'reference_link' => [
                                'type' => 'string',
                                'description' => 'Optional link back to the triggering action or context',
                            ],
                            'task_ids' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                                'description' => 'Optional array of Task IDs to generate clickable task references in UI. Always fill this when tasks are mentioned',
                            ],
                            'note_ids' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                                'description' => 'Optional array of Note IDs to generate clickable note references in UI. Always fill this when notes are mentioned',
                            ],
                        ],
                        'required' => ['message'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'findTaskByName',
                    'description' => 'Find a task by its name or title to obtain the task_id needed for posting to team chat. Return ONLY this tool call as the final response — no additional text before or after.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'task_name' => [
                                'type' => 'string',
                                'description' => 'The name or title of the task to search for',
                            ],
                        ],
                        'required' => ['task_name'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'findNoteByName',
                    'description' => 'Find a note by its name or title. Use this to search for notes and get their IDs.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'note_name' => [
                                'type' => 'string',
                                'description' => 'The name or title of the note to search for',
                            ],
                        ],
                        'required' => ['note_name'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'findMultipleTasksByName',
                    'description' => 'Find multiple tasks by their names or titles in a single call. More efficient than calling findTaskByName multiple times.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'task_names' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                                'description' => 'Array of task names or titles to search for',
                            ],
                        ],
                        'required' => ['task_names'],
                    ],
                ],
            ],
        ]);
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info('[TeamChatAgent] Handling function call', [
            'function' => $functionName,
            'arguments' => $arguments,
        ]);

        switch ($functionName) {
            case 'postToTeamChat':
                return $this->postToTeamChat($arguments, $orgId);
                
            case 'findTaskByName':
                return $this->findTaskByName($arguments, $orgId);

            case 'findNoteByName':
                return $this->findNoteByName($arguments, $orgId);
                
            case 'findMultipleTasksByName':
                return $this->findMultipleTasksByName($arguments, $orgId);

            case 'askTheTeamChat':
                try {
                
                    $agent = new AgentsTeamChatAgent($this->pulse);
                    $messageId = "";
                    $thread = TeamThread::where('pulse_id', $pulseId)
                        ->where('organization_id', $orgId)
                        ->latest()
                        ->first();
                    $messages = $thread->getThreadMessages();
            
                    $teamMessage = new TeamMessage();
                    $teamMessage->role = 'user';
                    $teamMessage->content = $arguments['message'];
                    $teamMessage->user_id = $this->user->id;
                    $teamMessage->team_thread_id = $thread->id;
                    $teamMessage->pulse_id = $pulseId;
                    $teamMessage->created_at = Carbon::now();
                    $teamMessage->updated_at = Carbon::now();
                    
                    $messages->push($teamMessage);
                    
                    $messages = TeamChatMessageProcessingService::getInstance()->formatMessagesWithSubThread($messages, $this->user->timezone, false, true);
                    $response = $agent->processMessageInMemory(collect($messages), $thread, $this->user, $messageId, false, false);
                    
                    return $response;
                } catch (\Throwable $th) {
                    Log::error('[TeamChatAgent] Error asking the team chat agent', [
                        'error' => $th->getMessage(),
                        'trace' => $th->getTraceAsString(),
                    ]);
                    return "Team chat agent encountered a problem, please try again later";
                }
            default:
                return parent::handleFunctionCall(
                    $functionName,
                    $arguments,
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );
        }
    }

    private function findNoteByName(array $arguments, string $orgId): string
    {
        $noteName = $arguments['note_name'] ?? '';

        if (empty($noteName)) {
            return json_encode([
                'error' => 'Note name is required',
                'ui' => [
                    'type' => 'error',
                    'message' => 'Please provide a note name to search for',
                ]
            ]);
        }

        try {
            // Search for notes matching the name
            $notes = \App\Models\Note::where('organization_id', $orgId)
                ->where('title', 'ILIKE', "%{$noteName}%")
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'pinned']);

            if ($notes->isEmpty()) {
                return json_encode([
                    'message' => 'No notes found matching the search criteria',
                    'ui' => [
                        'message' => 'No notes found matching your search.',
                    ]
                ]);
            }

            // Format the response
            $formattedNotes = $notes->map(function ($note) {
                return [
                    'id' => $note->id,
                    'title' => $note->title,
                    'pinned' => (bool) ($note->pinned ?? false),
                ];
            });

            return json_encode([
                'notes' => $formattedNotes,
                'ui' => [
                    'type' => 'note',
                    'notes' => $formattedNotes->map(function ($note) {
                        return [
                            'id' => $note['id'],
                            'title' => $note['title'],
                            'pinned' => $note['pinned'],
                        ];
                    })->toArray(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[TeamChatAgent] Error finding note by name', [
                'error' => $e->getMessage(),
                'note_name' => $noteName,
                'trace' => $e->getTraceAsString(),
            ]);

            return json_encode([
                'error' => 'Error searching for note',
                'ui' => [
                    'type' => 'error',
                    'message' => 'An error occurred while searching for the note.',
                ]
            ]);
        }
    }

    private function postToTeamChat(array $arguments, string $orgId): string
    {
        $message = $arguments['message'];
        // Default attribution to 'user' if not provided or invalid
        $rawAttribution = $arguments['attribution_type'] ?? 'user';
        $attributionType = in_array($rawAttribution, ['user', 'system']) ? $rawAttribution : 'user';
        $userId = $arguments['user_id'] ?? null;
        $taskIds = $arguments['task_ids'] ?? [];
        $noteIds = $arguments['note_ids'] ?? [];
        
        // Validate task_ids are valid UUIDs
        $taskIds = array_filter($taskIds, function($id) {
            return is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
        });
        
        // Validate note_ids are valid UUIDs
        $noteIds = array_filter($noteIds, function($id) {
            return is_string($id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
        });

        // Determine the posting user
        if ($attributionType === 'user') {
            $postingUser = $this->user;
        } else {
            $postingUser = PulseHelper::getSystemUser();
        }

        // Build attribution message
        $attribution = '';
        if ($attributionType === 'user') {
            $attribution = "Generated from Pulse Chat";
        } elseif ($attributionType === 'system') {
            $initiatorName = $this->user ? $this->user->name : 'Unknown';
            $attribution = "System notification (initiated by {$initiatorName})";
        }

        // Build team message content as references payload (optional task_id/note_id)
        $references = [];

        if (!empty($taskIds)) {
            foreach ($taskIds as $taskId) {
                $taskTitle = 'Related Task';
                try {
                    $task = \App\Models\Task::where('organization_id', $orgId)->find($taskId);
                    if ($task) {
                        $taskTitle = $task->title;
                    }
                } catch (\Exception $e) {
                    Log::warning('[TeamChatAgent] Unable to fetch task title for team message reference', [
                        'task_id' => $taskId,
                        'error' => $e->getMessage(),
                    ]);
                }

                $references[] = [
                    'type' => 'task',
                    'id' => $taskId,
                    'title' => $taskTitle,
                ];
            }
        }

        if (!empty($noteIds)) {
            foreach ($noteIds as $noteId) {
                $noteTitle = 'Related Note';
                
                try {
                    $note = \App\Models\Note::where('organization_id', $orgId)->find($noteId);
                    if ($note) {
                        $noteTitle = $note->title;
                    }
                } catch (\Exception $e) {
                    Log::warning('[TeamChatAgent] Unable to fetch note title for team message reference', [
                        'note_id' => $noteId,
                        'error' => $e->getMessage(),
                    ]);
                }

                $references[] = [
                    'type' => 'note',
                    'id' => $noteId,
                    'title' => $noteTitle,
                ];
            }
        }

        if ($references) {
            $teamMessageContent = json_encode([
                'message' => $message,
                "ui" => [
                    "type" => "references",
                    "references" => $references,
                ],
            ]);
        } else {
            $teamMessageContent = $message;
        }

        // Create TeamMessage record
        $teamThread = TeamThread::where('pulse_id', $this->pulse->id)->first();
        
        if (!$teamThread) {
            Log::error('[TeamChatAgent] No team thread found for pulse', [
                'pulse_id' => $this->pulse->id,
            ]);
            
            return json_encode([
                'error' => 'Team chat not available - no team thread found',
                'ui' => [
                    'type' => 'error',
                    'message' => 'Unable to post to team chat. Team thread not found.',
                ]
            ]);
        }
        
        if (!$postingUser) {
            Log::error('[TeamChatAgent] No posting user available', [
                'attribution_type' => $attributionType,
            ]);
            
            return json_encode([
                'error' => 'Unable to determine posting user',
                'ui' => [
                    'type' => 'error',
                    'message' => 'Unable to post to team chat. User not found.',
                ]
            ]);
        }

        try {
            $teamMessageData = [
                'team_thread_id' => $teamThread->id,
                'user_id' => $postingUser->id,
                'content' => $teamMessageContent,
                'organization_id' => $orgId,
                'is_from_pulse_chat' => true,
            ];

            if ($this->recommendation) {
                Log::info('[TeamChatAgent] Saving recommendation action', [
                    'recommendation' => $this->recommendation,
                ]);

                $this->saveRecommendationAction(
                    'team_chat',
                    'create',
                    $teamMessageData
                );

                return "Message posted successfully to team chat";
            }

            $teamMessage = TeamMessage::create($teamMessageData);
            
            if (!$teamMessage) {
                throw new \Exception('Failed to create team message record');
            }
            
            Log::info('[TeamChatAgent] Successfully posted to team chat', [
                'team_message_id' => $teamMessage->id,
                'attribution_type' => $attributionType,
                'user_id' => $postingUser->id,
                'message_length' => strlen($message),
            ]);
            
        } catch (\Exception $e) {
            Log::error('[TeamChatAgent] Failed to post to team chat', [
                'error' => $e->getMessage(),
                'attribution_type' => $attributionType,
                'user_id' => $postingUser->id,
                'trace' => $e->getTraceAsString(),
            ]);
            
            return json_encode([
                'error' => 'Failed to post message to team chat',
                'ui' => [
                    'type' => 'error',
                    'message' => 'An error occurred while posting to team chat. Please try again.',
                ]
            ]);
        }

        // Build References UI for Team Chat navigation
        $teamChatId = $teamThread->id;

        $response = [
            'message' => 'Message posted successfully to team chat',
            'ui' => [
                'type' => 'references',
                'references' => [
                    [
                        'type' => 'team_chat',
                        'id' => $teamChatId,
                        'title' => 'Team Chat',
                    ],
                ],
            ],
        ];

        return json_encode($response);
    }

    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::ReferencesSchema,
            BaseSchema::ConfirmationSchema,
            BaseSchema::OptionsSchema,
        ]);
    }
    
    private function findTaskByName(array $arguments, string $orgId): string
    {
        $taskName = $arguments['task_name'] ?? '';
        
        if (empty($taskName)) {
            return json_encode([
                'error' => 'Task name is required',
                'ui' => [
                    'type' => 'error',
                    'message' => 'Please provide a task name to search for',
                ]
            ]);
        }

        try {
            // Search for tasks matching the name
            $tasks = \App\Models\Task::where('organization_id', $orgId)
                ->where('title', 'ILIKE', "%{$taskName}%")
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'status']);

            if ($tasks->isEmpty()) {
                return json_encode([
                    'message' => 'No tasks found matching the search criteria',
                    'ui' => [
                        'type' => 'info',
                        'message' => 'No tasks found matching your search.',
                    ]
                ]);
            }

            // Format the response
            $formattedTasks = $tasks->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                ];
            });

            return json_encode([
                'tasks' => $formattedTasks,
                'ui' => [
                    'type' => 'task',
                    'tasks' => $formattedTasks->map(function ($task) {
                        return [
                            'id' => $task['id'],
                            'title' => $task['title'],
                            'status' => $task['status'],
                        ];
                    })->toArray(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[TeamChatAgent] Error finding task by name', [
                'error' => $e->getMessage(),
                'task_name' => $taskName,
                'trace' => $e->getTraceAsString(),
            ]);

            return json_encode([
                'error' => 'Error searching for task',
                'ui' => [
                    'type' => 'error',
                    'message' => 'An error occurred while searching for the task.',
                ]
            ]);
        }
    }

    private function findMultipleTasksByName(array $arguments, string $orgId): string
    {
        $taskNames = $arguments['task_names'] ?? [];
        
        if (empty($taskNames)) {
            return json_encode([
                'error' => 'Task names array is required',
                'ui' => [
                    'type' => 'error',
                    'message' => 'Please provide an array of task names to search for',
                ]
            ]);
        }

        try {
            $allTasks = [];
            $allFormattedTasks = [];
            
            foreach ($taskNames as $taskName) {
                if (empty($taskName)) continue;
                
                // Search for tasks matching this name
                $tasks = \App\Models\Task::where('organization_id', $orgId)
                    ->where('title', 'ILIKE', "%{$taskName}%")
                    ->orderBy('created_at', 'desc')
                    ->limit(3) // Limit per search to avoid too many results
                    ->get(['id', 'title', 'status']);

                foreach ($tasks as $task) {
                    $taskData = [
                        'id' => $task->id,
                        'title' => $task->title,
                        'status' => $task->status,
                        'search_term' => $taskName,
                    ];
                    
                    // Avoid duplicates
                    if (!in_array($task->id, array_column($allTasks, 'id'))) {
                        $allTasks[] = $taskData;
                        $allFormattedTasks[] = [
                            'id' => $task->id,
                            'title' => $task->title,
                            'status' => $task->status,
                        ];
                    }
                }
            }

            if (empty($allTasks)) {
                return json_encode([
                    'message' => 'No tasks found matching any of the search criteria',
                    'ui' => [
                        'type' => 'info',
                        'message' => 'No tasks found matching your searches.',
                    ]
                ]);
            }

            return json_encode([
                'tasks' => $allTasks,
                'ui' => [
                    'type' => 'task',
                    'tasks' => $allFormattedTasks,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[TeamChatAgent] Error finding multiple tasks by name', [
                'error' => $e->getMessage(),
                'task_names' => $taskNames,
                'trace' => $e->getTraceAsString(),
            ]);

            return json_encode([
                'error' => 'Error searching for tasks',
                'ui' => [
                    'type' => 'error',
                    'message' => 'An error occurred while searching for the tasks.',
                ]
            ]);
        }
    }
}



