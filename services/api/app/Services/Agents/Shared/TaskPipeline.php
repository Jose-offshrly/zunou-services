<?php

namespace App\Services\Agents\Shared;

use App\Enums\TaskType;
use App\Helpers\VectorDBHelper;
use App\Models\PulseMember;
use App\Models\Task;
use App\Schemas\TaskSchema;
use App\Services\Agents\Handlers\DataSourceHandler;
use App\Services\Agents\Helpers\DataSourceHelper;
use App\Services\OpenAIService;
use App\Services\VectorDBService;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Promise\Utils;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Probots\Pinecone\Client as Pinecone;
use Ramsey\Uuid\Uuid;

class TaskPipeline
{
    public string $organizationId;
    public string $pulseId;
    private array $cache                   = [];
    private ?Collection $pulseMembers      = null;
    private ?array $membersById            = null;
    private ?array $membersByName          = null;
    private ?array $allMembersArray        = null;
    public const TASK_SIMILARITY_THRESHOLD = 0.6;

    public function __construct(string $organizationId, string $pulseId)
    {
        $this->organizationId = $organizationId;
        $this->pulseId        = $pulseId;
    }

    public function run(array $tasks, ?bool $autoAssign = true, ?bool $processDuplicates = true)
    {
        if (empty($tasks)) {
            throw new \Exception('Tasks cannot be empty');
        }

        // $hydratedTasks = $this->hydrateAssignees($tasks);
        $tasksWithAssignee = $this->assignMembersToTasks($tasks, $autoAssign);
        $duplicateTasks = [];
        if ($processDuplicates) {
            $result = $this->processDuplicates($tasksWithAssignee);
            $duplicateTasks = $result['duplicateTasks'];
            $tasksWithAssignee = $result['newTasks'];
        }

        return [
            'tasks'          => $tasksWithAssignee,
            'duplicateTasks' => $duplicateTasks,
        ];
    }

    /** Replace assignee name with real name and id from database */
    public function hydrateAssignees(array $tasks)
    {
        foreach ($tasks as &$task) {
            // NOTE: use reference
            if (empty($task['assignees'])) {
                continue;
            }

            $task['assignees'] = $this->hydrateAssignee($task);
        }

        return $tasks;
    }

    public function assignMembersToTasks(array $tasks, bool $autoAssign)
    {
        // Pre-load all members once to avoid N+1 queries
        $this->loadPulseMembers();

        $unassignedTasks = [];
        $assignedTasks   = [];

        foreach ($tasks as $task) {
            if (
                isset($task['is_for_everyone']) && $task['is_for_everyone'] == true
            ) {
                $allMembers        = $this->assignAllMembersToTask();
                $task['assignees'] = $allMembers;
                $assignedTasks[]   = $task;
                continue;
            }

            if (empty($task['assignees'])) {
                $unassignedTasks[] = $task;
                continue;
            }

            // If the task has assignees, we need to hydrate them with real names and ids, otherwise remove them
            $task['assignees'] = $this->hydrateAssignee($task);

            if (empty($task['assignees'])) {
                $unassignedTasks[] = $task;
                continue;
            }

            $assignedTasks[] = $task;
        }

        if (empty($unassignedTasks)) {
            return $assignedTasks;
        }

        if (! $autoAssign) {
            return array_merge($assignedTasks, $unassignedTasks);
        }
        $newlyAssignedTasks = $this->assignMembersToTaskWIthLLM(
            $unassignedTasks,
        );
        return array_merge($assignedTasks, $newlyAssignedTasks['tasks']);
    }

    public function assignMembersToTaskWIthLLM(array $unassignedTasks)
    {
        // Use pre-loaded members instead of querying again
        $this->loadPulseMembers();
        $members = $this->pulseMembers;

        $membersPrompt = $this->formatPulseMembersForLLM($members);

        $SYSTEM_PROMPT = <<<PROMPT
You are a task assignment assistant.

You are given:
- A list of users (with their job descriptions and responsibilities)
- A list of tasks (with id, title, and description)

Your job is to decide **who should be assigned to each task**, but you must keep the output **very small**:
- Only return the fields defined in the JSON schema (task id and assignees).
- Do **not** include any extra commentary, explanations, or unused fields.

Assignment rules:

1. Explicit assignee from the task text  
   - Look at the **title and description** of the task.  
   - If a person's name is explicitly mentioned as the assignee (for example: "Jose to deploy...", "Action for Louie", "Kyle to finish API"), assign that person.  
   - Treat reasonable **nicknames or short forms** (e.g. "Joe" for "Jose", first name only, or common spelling variations) as referring to the same person when it is clear from the user list context.  
   - Use the user list to resolve the correct member (match by name or obvious nickname/variant).

2. Implicit assignee by role / responsibilities  
   - If no explicit assignee is mentioned, look at the **nature of the task**.  
   - Match the task to the member whose **job description / responsibilities** best fit what the task is about.  
   - Also look for descriptions of the assignee in the task text (for example: "frontend dev", "infra lead", "project manager", or plural role words like "developers", "testers", "designers") and match that to a member’s role.


3. Number of assignees  
   - Prefer **one best assignee** per task.  
   - Only return more than one assignee if the task clearly involves multiple people (for example, multiple names mentioned as responsible).

### Users
The following users are available for assignment:

$membersPrompt

Tasks will be provided as JSON. Return only the minimal JSON that matches the response schema.
PROMPT;
        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'tasks_with_assignees_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'tasks' => [
                            'type'  => 'array',
                            'items' => [
                                'type'     => 'object',
                                'required' => [
                                    'task_id',
                                    'assignees',
                                ],
                                'additionalProperties' => false,
                                'properties'           => [
                                    'task_id' => [
                                        'type'        => 'string',
                                        'description' => 'The provided unique id of the task.',
                                    ],
                                    'assignees' => [
                                        'type'        => 'array',
                                        'description' => 'The assignees for the task, contains full name and ID of the person assigned to this task.',
                                        'items'       => [
                                            'type'     => 'object',
                                            'required' => [
                                                'id',
                                                'name',
                                            ],
                                            'additionalProperties' => false,
                                            'properties'           => [
                                                'id' => [
                                                    'type'        => 'string',
                                                    'description' => 'The user id of the assignee, formatted as UUID.',
                                                ],
                                                'name' => [
                                                    'type'        => 'string',
                                                    'description' => 'The full name of the assignee.',
                                                ],
                                            ],
                                        ],
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

        $tasksSlimmed   = [];
        $taskIndexById  = [];
        foreach ($unassignedTasks as $index => $task) {
            $taskId = (string) Str::uuid();

            $tasksSlimmed[] = [
                'task_id'     => $taskId,
                'title'       => $task['title'],
                'description' => $task['description'] ?? '',
            ];

            $taskIndexById[$taskId] = $index;
        }

        $response = OpenAIService::createCompletion([
            'model'       => 'gpt-4.1-mini',
            'temperature' => 0.1,
            'messages'    => [
                [
                    'role'    => 'system',
                    'content' => $SYSTEM_PROMPT,
                ],
                [
                    'role'    => 'user',
                    'content' => json_encode($tasksSlimmed),
                ],
            ],
            'response_format' => $schema,
        ]);

        $payload = json_decode($response->choices[0]->message->content, true);

        // Map the response back to the original unassigned tasks by task_id
        if (! empty($payload['tasks'])) {
            foreach ($payload['tasks'] as $taskResult) {
                $taskId    = $taskResult['task_id'] ?? null;
                $assignees = $taskResult['assignees'] ?? [];

                if (! $taskId || empty($assignees)) {
                    continue;
                }

                if (! isset($taskIndexById[$taskId])) {
                    continue;
                }

                $originalIndex = $taskIndexById[$taskId];
                $unassignedTasks[$originalIndex]['assignees'] = $assignees;
                unset($unassignedTasks[$originalIndex]['task_id']);
            }
        }

        // Return the original tasks array, now enriched with any assignees from the LLM
        return ['tasks' => $unassignedTasks];
    }

    public function processDuplicates(array $tasks)
    {
        $newTasks       = [];
        $duplicateTasks = [];

        $taskTitleAndDescriptions = array_map(function ($task) {
            return $task['title'] . ' ' . ($task['description'] ?? '');
        }, $tasks);
        $start      = microtime(true);
        $embeddings = VectorDBService::getEmbeddings($taskTitleAndDescriptions);
        $end        = microtime(true);
        $duration   = $end - $start;

        Log::info("Embedding Execution time: {$duration} seconds");

        $start             = microtime(true);
        $allSimilarMatches = $this->batchSearchForDuplicates(
            $embeddings,
            $this->organizationId,
            "tasks:{$this->pulseId}",
        );
        $end      = microtime(true);
        $duration = $end - $start;
        Log::info("Search Duplicate Execution time: {$duration} seconds");

        $taskNumber = 1;
        foreach ($tasks as $index => $task) {
            Log::debug('Processing task', [
                'task' => $task,
            ]);

            // add unique id for tracking purposes
            $task['task_number'] = $taskNumber;
            $taskNumber++;

            $matches = $allSimilarMatches[$index];

            if (! empty($matches)) {
                $duplicateTasks[$task['task_number']] = [
                    ...$task,
                    'matches' => $matches,
                ];
                continue;
            }

            // Remove task_number from new tasks - only used for tracking during processing
            unset($task['task_number']);
            $newTasks[] = $task;
        }

        if (empty($duplicateTasks)) {
            return ['newTasks' => $newTasks, 'duplicateTasks' => []];
        }

        $result = $this->checkSimilarityByAI($duplicateTasks);

        Log::debug('ai simmilarity check results', $result);
        foreach ($result as $taskEval) {
            $taskItem = $duplicateTasks[$taskEval['task_number']];
            if ($taskEval['is_duplicate']) {

                $duplicateTasks[$taskEval['task_number']]['matches'] = collect($duplicateTasks[$taskEval['task_number']]['matches'])->values()->map(function($match) {
                    $metadata = $match['metadata'];
                    $metadata['id'] = $metadata['task_id'];
                    return $metadata;
                });
                unset($duplicateTasks[$taskEval['task_number']]['task_number']);
            } else {
                // Remove matches from new tasks - only keep in duplicate tasks
                unset($taskItem['matches']);
                unset($taskItem['task_number']);
                $newTasks[] = $taskItem;
                unset($taskEval);
            }
        }

        return ['newTasks' => $newTasks, 'duplicateTasks' => $duplicateTasks];
    }

    public function batchSearchForDuplicates(
        $embeddings,
        $indexName,
        $namespace,
    ) {
        $client   = new Client();
        $promises = [];

        $apiKey      = config('zunou.pinecone.api_key');
        $pinecone    = new Pinecone($apiKey);
        $pinecone    = VectorDBHelper::setIndexHost($pinecone, $indexName);
        $pineconeUrl = $pinecone->indexHost;

        foreach ($embeddings as $vector) {
            $promises[] = $client->postAsync("{$pineconeUrl}/query", [
                'headers' => [
                    'Api-Key'                => $apiKey,
                    'Content-Type'           => 'application/json',
                    'X-Pinecone-API-Version' => '2025-01',
                ],
                'json' => [
                    'vector'          => $vector,
                    'namespace'       => $namespace,
                    'topK'            => 2,
                    'includeMetadata' => true,
                    'includeValues'   => false,
                    'filter'          => [
                        'type' => [
                            '$ne' => 'LIST',
                        ],
                    ],
                ],
            ]);
        }

        // Wait for all promises to complete
        $responses = Utils::unwrap($promises);

        return array_map(function ($response) {
            $result = json_decode($response->getBody(), true);
            return array_filter($result['matches'], function ($match) {
                return $match['score'] >= self::TASK_SIMILARITY_THRESHOLD;
            });
        }, $responses);
    }

    public function searchForDuplicates($embedding)
    {
        try {
            $pc      = new VectorDBService();
            $matches = $pc->query(
                $embedding,
                $this->organizationId,
                "tasks:{$this->pulseId}",
                2,
                [
                    'type' => [
                        '$ne' => 'LIST',
                    ],
                ],
            );
        } catch (\Throwable $th) {
            Log::debug($th->getMessage());
        }

        $matches = array_filter($matches, function ($match) {
            return $match['score'] >= self::TASK_SIMILARITY_THRESHOLD;
        });
        Log::debug('Matches', [
            'matches' => $matches,
        ]);

        return $matches ?? null;
    }

    public function checkSimilarityByAI(array $duplicateTasks)
    {
        Log::debug('duplicate tasks befoere ai', $duplicateTasks);
        $TASK_PROMPT = '';
        $taskNo      = 1;
        foreach ($duplicateTasks as $duplicate) {
            $matchList = json_encode(
                array_map(function ($match) {
                    return [
                        'task_id'     => $match['metadata']['task_id'],
                        'title'       => $match['metadata']['title'],
                        'description' => $match['metadata']['description'] ?? 'N/A',
                    ];
                }, $duplicate['matches']),
                JSON_PRETTY_PRINT,
            );

            $task = json_encode(
                [
                    'task_number'     => $duplicate['task_number'],
                    'title'       => $duplicate['title'],
                    'description' => $duplicate['description'] ?? '',
                ],
                JSON_PRETTY_PRINT,
            );

            $TASK_PROMPT .= <<<EOT
Here's the new task #{$taskNo},
{$task}

Here are the possible duplicates,
{$matchList}

EOT;
            $taskNo += 1;
        }

        $SYSTEM_PROMPT = <<<PROMPT
You are an AI system responsible for evaluating whether a newly created task is a duplicate of existing tasks in the system.

You will receive:
1. A new task (task number, title and optional description)
2. A list of potentially similar existing tasks (existing task_id, title and optional description)

Your job is to determine, for each existing task, how similar it is to the new task and whether the new task should be considered a duplicate. You must think beyond exact wording — consider **intent**, **function**, and **scope**.

---

### 🔍 Key Evaluation Rules:

- ✅ A task is **new** if:
- Its core intent or outcome is **different** from all existing tasks.
- It adds a **new feature**, expands on, or builds upon an existing task.  
    ⚠️ **This is crucial**: if the new task is related to an existing one but introduces a *new aspect or functionality*, it is **NOT a duplicate**.

- ❌ A task is a **duplicate** if:
- Its functional purpose and implementation substantially overlap with an existing task — even if worded differently.
- It accomplishes the **same end goal**, regardless of minor phrasing or wording changes.

---

### 🧠 Special Considerations:
- Minor wording differences or slight rephrasings do **not** make a task new.
- Tasks that cover different implementation layers (e.g., frontend vs backend) should be considered distinct, even if they support the same feature — for example, "Forgot Password API Endpoint" and "Forgot Password UI Integration" are not duplicates.

---

Here are the new tasks and their possibly similar records:

{$TASK_PROMPT}

---

### ✅ Response Format:
```json
{
    // these are the fields from the new task, copy them as is. These will be repeated two depending of the number of matches for this new task. If two matches, these will be present on both.
    "task_number": "The original task number of the new task (unchanged)",
    "title": "The title of new task (unchanged)",

    // these are the fields from the matched task, copy them as is
    "task_id": "The unique task id of the matched task, formatted as UUID (unchanged)",
    "retrieved_task_title": "The title of the retrieved task being compared to the new task",

    // these are fields that are calculated by you as evaluation
    "similarity_rating": A score from 1 to 5 indicating how similar the retrieved task is to the new task. 1 = completely different, 5 = nearly identical.",
    "is_duplicate": "Whether the retrieved task is considered a duplicate of the new task.",
    "reason": "A concise explanation of why the task is or isn’t a duplicate",
}
```
PROMPT;
        Log::debug($SYSTEM_PROMPT);
        $response = OpenAIService::createCompletion([
            'model'       => 'gpt-4.1',
            'temperature' => 0.7,
            'messages'    => [
                [
                    'role'    => 'system',
                    'content' => $SYSTEM_PROMPT,
                ],
            ],
            'response_format' => TaskSchema::SimilarityEvalSchema,
        ]);

        $eval = json_decode($response->choices[0]->message->content, true);

        return $this->deduplicateTasks($eval['tasks_evaluation']);
    }

    public function deduplicateTasks(array $tasks)
    {
        // Select duplicate, Pick the one with the highest similarity_rating if there are multiple duplicates or none
        $result = [];

        $grouped = [];
        foreach ($tasks as $task) {
            $grouped[$task['task_number']][] = $task;
        }

        foreach ($grouped as $taskId => $taskGroup) {
            $duplicates = array_filter(
                $taskGroup,
                fn ($t) => $t['is_duplicate'],
            );
            $candidates = ! empty($duplicates) ? $duplicates : $taskGroup;

            usort(
                $candidates,
                fn ($a, $b) => $b['similarity_rating'] <=> $a['similarity_rating'],
            );
            $result[] = $candidates[0];
        }

        return $result;
    }

    public function formatPulseMembersForLLM(Collection $pulseMembers): string
    {
        return $pulseMembers
            ->map(function ($member) {
                $userId           = $member->user->id;
                $name             = $member->user->name;
                $job_description  = $member->job_description   ?? 'N/A';
                $responsibilities = $member->responsibilities ?? [];

                // Format array of strings into a bullet-point list
                $responsibilitiesText = is_array($responsibilities) && ! empty($responsibilities)
                        ? collect($responsibilities)
                            ->map(fn ($item) => "- {$item}")
                            ->implode("\n")
                        : '- N/A';

                return <<<TEXT
User ID: {$userId}  
Name: {$name}  
Job Description: {$job_description}  
Responsibilities: {$responsibilitiesText}
TEXT;
            })
            ->implode("\n\n");
    }

    public function hydrateAssignee(array $task)
    {
        // Ensure members are loaded
        $this->loadPulseMembers();

        foreach ($task['assignees'] as &$assignee) {
            $id   = $this->valueOrNull($assignee, 'id');
            $name = $this->valueOrNull($assignee, 'name');

            if ($id && Uuid::isValid($id)) {
                // Check cache first
                if (!empty($name) && isset($this->cache[$name])) {
                    $assignee = $this->cache[$name];
                    continue;
                }

                // Use lookup map instead of database query
                if (isset($this->membersById[$id])) {
                    $member = $this->membersById[$id];
                    $assignee['id']     = $member->user->id;
                    $assignee['name']   = $member->user->name;
                    $name = $member->user->name;
                    $this->cache[$name] = [...$assignee];
                    continue;
                }
            }

            if ($name) {
                // Check cache first
                if (isset($this->cache[$name])) {
                    $assignee = $this->cache[$name];
                    continue;
                }

                // Try exact match first (fastest)
                $normalizedName = $this->normalizeName($name);
                if (isset($this->membersByName[$normalizedName])) {
                    $member = $this->membersByName[$normalizedName];
                    $assignee['id']     = $member->user->id;
                    $assignee['name']   = $member->user->name;
                    $this->cache[$name] = [...$assignee];
                    continue;
                }

                // Try fuzzy matching (case-insensitive, partial match)
                $member = $this->findMemberByNameFuzzy($name);
                if ($member) {
                    $assignee['id']     = $member->user->id;
                    $assignee['name']   = $member->user->name;
                    $this->cache[$name] = [...$assignee];
                    continue;
                }
            }

            // the provided name or id does not exist in the database
            $assignee = null;
        }

        $finalAssignees = array_filter($task['assignees'], function (
            $assignee,
        ) {
            return ! is_null($assignee);
        });

        return $finalAssignees;
    }

    public function assignAllMembersToTask()
    {
        // Use cached result if available
        if ($this->allMembersArray !== null) {
            return $this->allMembersArray;
        }

        // Ensure members are loaded
        $this->loadPulseMembers();

        $this->allMembersArray = $this->pulseMembers
            ->map(
                fn ($member) => [
                    'id'   => $member->user->id,
                    'name' => $member->user->name,
                ],
            )
            ->values()
            ->toArray();

        return $this->allMembersArray;
    }

    /**
     * Load all PulseMembers for this pulse once and build lookup maps
     * This eliminates N+1 queries by pre-loading all data
     */
    private function loadPulseMembers(): void
    {
        if ($this->pulseMembers !== null) {
            return; // Already loaded
        }

        $this->pulseMembers = PulseMember::with('user')
            ->where('pulse_id', $this->pulseId)
            ->get();

        // Build lookup maps for fast access
        $this->membersById   = [];
        $this->membersByName = [];

        foreach ($this->pulseMembers as $member) {
            // Map by user_id for fast ID lookups
            $this->membersById[$member->user_id] = $member;

            // Map by normalized name for fast name lookups
            $normalizedName = $this->normalizeName($member->user->name);
            // Store first match (in case of duplicates, first wins)
            if (!isset($this->membersByName[$normalizedName])) {
                $this->membersByName[$normalizedName] = $member;
            }
        }
    }

    /**
     * Normalize name for consistent matching (lowercase, trim whitespace)
     */
    private function normalizeName(string $name): string
    {
        return strtolower(trim($name));
    }

    /**
     * Find member by name using fuzzy matching (case-insensitive, partial match)
     * This is faster than database full-text search since we're working in memory
     */
    private function findMemberByNameFuzzy(string $searchName): ?PulseMember
    {
        $normalizedSearch = $this->normalizeName($searchName);
        $searchWords      = explode(' ', $normalizedSearch);

        // Try to find best match
        $bestMatch     = null;
        $bestScore     = 0;

        foreach ($this->pulseMembers as $member) {
            $memberName = $this->normalizeName($member->user->name);
            $memberWords = explode(' ', $memberName);

            // Calculate similarity score
            $score = 0;
            foreach ($searchWords as $searchWord) {
                foreach ($memberWords as $memberWord) {
                    // Exact match gets highest score
                    if ($searchWord === $memberWord) {
                        $score += 10;
                    }
                    // Partial match (starts with or contains)
                    elseif (str_starts_with($memberWord, $searchWord) || str_contains($memberWord, $searchWord)) {
                        $score += 5;
                    }
                    // Reverse: search word contains member word
                    elseif (str_contains($searchWord, $memberWord)) {
                        $score += 3;
                    }
                }
            }

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $member;
            }
        }

        // Only return if we have a reasonable match (at least one word matched)
        return $bestScore > 0 ? $bestMatch : null;
    }

    private function valueOrNull($var, $key = null)
    {
        if ($key) {
            return empty($var[$key]) ? null : $var[$key];
        }

        return empty($var) ? null : $var;
    }

    public static function prepareTaskForEmbedding(Task $task): array
    {
        return [
            'id'   => $task->id,
            'data' => $task->title .
                ($task->description ? ' ' . $task->description : ''),
            'metadata' => [
                'task_id'     => $task->id,
                'entity_id'   => $task->entity_id     ?? '',
                'parent_id'   => $task->parent_id     ?? '',
                'category_id' => $task->category_id ?? '',
                'title'       => $task->title,
                'description' => $task->description ?? '',
                'status'      => $task->status           ?? '',
                'priority'    => $task->priority       ?? '',
                'type'        => $task->type               ?? '',
                'due_date'    => $task->due_date
                    ? Carbon::parse($task->due_date)->startOfDay()->timestamp
                    : '',
                'deleted_at' => $task->deleted_at
                    ? Carbon::parse($task->deleted_at)->timestamp
                    : '',
            ],
        ];
    }

    public static function transformTaskForDisplay(
        Task $task,
        ?string $timezone = 'UTC',
    ): array {
        $taskRoot = [
            'task_id'     => $task->id,
            'title'       => $task->title,
            'description' => $task->description ?? '',
            'created_at'  => Carbon::parse($task->created_at)->tz($timezone)->format('F j, Y'),
            'updated_at'  => $task->updated_at
                ? Carbon::parse($task->updated_at)->tz($timezone)->format('F j, Y')
                : '',
        ];

        if ($task->type?->value === TaskType::TASK->value) {
            $taskContext = '';
            if (! is_null($task->source_id)) {
                $actionItem = [
                    'task_id'   => $task->id,
                    'title'     => $task->title,
                    'source_id' => $task->source_id,
                ];

                try {
                    $actionItemsDetails = self::explainTasks(
                        [$actionItem],
                        $task->source_id,
                        $task->organization_id,
                        $task->entity_id,
                    );
                    $actionItemsDetails = json_decode(
                        $actionItemsDetails,
                        true,
                    );
                    $result = $actionItemsDetails['action_item_results'];

                    if (! empty($result)) {
                        $taskContext = $result[0]['action_item_details'];
                    }
                } catch (\Throwable $th) {
                    Log::error('Error getting action items details', [
                        'error'   => $th->getMessage(),
                        'trace'   => $th->getTraceAsString(),
                        'task_id' => $task->id,
                    ]);
                }
            }

            return [
                ...$taskRoot,
                'task_context' => isset($taskContext) ? $taskContext : '',
                'due_date'     => $task->due_date
                    ? Carbon::parse($task->due_date)
                        ->tz($timezone)
                        ->format('F j, Y')
                    : 'no due date',
                'status'    => $task->status,
                'priority'  => $task->priority,
                'type'      => $task->type?->value,
                'assignees' => $task->assignees
                    ->map(fn ($assignee) => $assignee->user)
                    ->filter()
                    ->map(
                        fn ($user) => [
                            'id'    => $user->id,
                            'name'  => $user->name,
                            'email' => $user->email,
                        ],
                    )
                    ->values()
                    ->toArray(),
            ];
        }

        if (empty($task->children)) {
            return [
                ...$taskRoot,
                'type'       => $task->type?->value,
                'created_at' => Carbon::parse($task->created_at)->tz($timezone)->format(
                    'F j, Y',
                ),
                'updated_at' => Carbon::parse($task->updated_at)->tz($timezone)->format(
                    'F j, Y',
                ),
            ];
        }

        $filteredChildrenTitle = $task->children
            ->filter(function ($child) {
                return ! is_null($child->source_id);
            })
            ->map(
                fn ($child) => [
                    'task_id'   => $child->id,
                    'title'     => $child->title,
                    'source_id' => $child->source_id,
                ],
            )
            ->values();

        $actionItemsDetailsObject = [];

        if (count($filteredChildrenTitle) > 0) {
            try {
                // Group children by source_id
                $groupedBySourceId = $filteredChildrenTitle->groupBy(
                    'source_id',
                );

                foreach ($groupedBySourceId as $sourceId => $tasksForSource) {
                    $tasksForSourceArray = $tasksForSource->values()->all();

                    $actionItemsDetails = self::explainTasks(
                        $tasksForSourceArray,
                        $sourceId,
                        $task->organization_id,
                        $task->entity_id,
                    );

                    $actionItemsDetails = json_decode(
                        $actionItemsDetails,
                        true,
                    );

                    if (isset($actionItemsDetails['action_item_results'])) {
                        foreach (
                            $actionItemsDetails['action_item_results'] as $actionItem
                        ) {
                            $actionItemsDetailsObject[$actionItem['task_id']] = $actionItem['action_item_details'];
                        }
                    }
                }
            } catch (\Throwable $th) {
                Log::error('Error getting action items details for subtasks', [
                    'error'          => $th->getMessage(),
                    'trace'          => $th->getTraceAsString(),
                    'parent_task_id' => $task->id ?? '',
                ]);
            }
        }

        return [
            ...$taskRoot,
            'type'       => $task->type?->value,
            'created_at' => Carbon::parse($task->created_at)->tz($timezone)->format('F j, Y'),
            'updated_at' => Carbon::parse($task->updated_at)->tz($timezone)->format('F j, Y'),
            'subtasks'   => $task->children
                ->map(
                    fn ($child) => [
                        'task_id'      => $child->id,
                        'title'        => $child->title,
                        'description'  => $child->description,
                        'task_context' => $actionItemsDetailsObject[$child->id] ?? '',
                        'due_date'     => $child->due_date
                            ? Carbon::parse($child->due_date)->tz($timezone)->format('F j, Y')
                            : 'no due date',
                        'status'     => $child->status,
                        'priority'   => $child->priority,
                        'type'       => $child->type?->value,
                        'created_at' => Carbon::parse(
                            $child->created_at,
                        )->tz($timezone)->format('F j, Y'),
                        'updated_at' => Carbon::parse(
                            $child->updated_at,
                        )->tz($timezone)->format('F j, Y'),
                        'assignees' => $child->assignees
                            ->map(fn ($assignee) => $assignee->user)
                            ->filter()
                            ->map(
                                fn ($user) => [
                                    'id'    => $user->id,
                                    'name'  => $user->name,
                                    'email' => $user->email,
                                ],
                            )
                            ->values()
                            ->toArray(),
                    ],
                )
                ->toArray(),
        ];
    }

    protected static function explainTasks(
        $tasks,
        $dataSourceId,
        $orgId,
        $pulseId,
    ) {
        try {
            $actionItems = json_encode($tasks, JSON_PRETTY_PRINT);
            $query       = <<<TEXT
For each of the following action items, extract exactly what was said — no assumptions.

Task Input Structure
```json
[
    {
        "task_id": "the unique id of the task in UUID format (this is provided and should be return exactly as is)",
        "action_item": "the action item that needed to extracted details"
    }
    ...more  
]
```

Expected output
```json
[
    {
        "task_id": "the unique id of the task in UUID format (this is provided and should be return exactly as is)",
        "action_item_details": "the action item details extracted from the meeting"
    }
    ...more
]
```

**Action Items:** {$actionItems}

For each item, format the output like this:

---
## [Action Item]
Restate the action item as mentioned in the transcript, or say "Not mentioned".

## Task Explanation
What is this task about? Describe it clearly using only what was said.

## Discussion
Summarize any direct conversation, clarifications, reasoning, or context discussed in the meeting.

## Transcript Excerpt
Include the most relevant quote(s) where this task was discussed. Add speaker names and timestamps if available.
---

Repeat this format for **each** action item listed.
TEXT;

            $responseFormat = [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'response_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            'action_item_results' => [
                                'type'  => 'array',
                                'items' => [
                                    'type'       => 'object',
                                    'properties' => [
                                        'task_id' => [
                                            'type'        => 'string',
                                            'description' => 'The unique id of the task in UUID format (this is provided and should be returned exactly as is).',
                                        ],
                                        'action_item_details' => [
                                            'type'        => 'string',
                                            'description' => 'A complete, structured explanation of the task, including restated action item, explanation, discussion, and transcript excerpt, following the requested format in markdown.',
                                        ],
                                    ],
                                    'required' => [
                                        'task_id',
                                        'action_item_details',
                                    ],
                                    'additionalProperties' => false,
                                ],
                            ],
                        ],
                        'required'             => ['action_item_results'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ];

            $helper   = new DataSourceHelper($orgId, $pulseId);
            $response = $helper->query($query, $dataSourceId, $responseFormat);

            return $response;
        } catch (\Throwable $th) {
            Log::error($th->getMessage());
            return null;
        }
    }
    
    public static function explainTask(
        $task,
        $dataSourceId,
        $orgId,
        $pulseId,
    ) {
        try {
            $task = $task->title;
            $description = $task->description ?? 'no description';

            $handler         = new DataSourceHandler($orgId, $pulseId);
            $documentContent = $handler->retrieveFullText($dataSourceId);

            $content = $documentContent ?? 'no content';
            $query       = <<<TEXT
Given the following task and description (Optional), extract the details of the task from the source. The source is where the task was mentioned.
The output should answer the questions such as: "What is this task about?", "What is the status of the task?" "Who is the assignee?" etc.
Do not make up any details, only answer the questions based on the source transcript.

Here is the task and description:

Task: {$task}

Description: {$description}

Here's the source transcript: {$content}

Return the details only, no introduction or anything else.
TEXT;

            $response = OpenAIService::createCompletion([
                'model'       => 'gpt-4.1',
                'temperature' => 0.7,
                'messages'    => [
                    ['role' => 'user', 'content' => $query],
                ],
            ]);

            return $response->choices[0]->message->content ?? "No additional details, proceed with the current task details";
        } catch (\Throwable $th) {
            Log::error($th->getMessage());
            return "No additional details, proceed with the current task details";
        }
    }
}
