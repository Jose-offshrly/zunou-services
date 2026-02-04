<?php

declare(strict_types=1);

namespace App\Actions;

use App\Actions\Task\CreateTaskAction;
use App\Contracts\Taskable;
use App\DataTransferObjects\Task\TaskData;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\PulseMember;
use App\Models\Task;
use App\Schemas\TaskSchema;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CreateSmartTasksAction
{
    public function __construct(
        private readonly CreateTaskAction $createTaskAction
    ) {
    }

    /**
     * Handle the creation of smart tasks from transcript input.
     */
    public function handle(
        ?string $taskListId,
        ?string $taskListName,
        string $transcript,
        string $organizationId,
        Taskable $entity
    ): Collection {
        $user = Auth::user();

        // Find existing task list by ID or create a new one
        $taskList = $this->findOrCreateTaskList(
            $taskListId,
            $taskListName,
            $organizationId,
            $entity
        );

        // REPLACE WITH AI GENERATED TASKS
        $assignees = PulseMember::where('pulse_id', $entity->id)->get();
        $assignees = $this->formatAssignees($assignees);

        $tasks = $this->extractTasksFromTranscript($transcript, $assignees);
        $createdTasks = collect();

        // Create individual tasks under the task list
        foreach ($tasks['tasks'] as $task) {
            $dueDate = empty($task['due_date'])
                ? null
                : Carbon::parse($task['due_date']);

            $assignees = collect($task['assignees'] ?? [])
                ->pluck('id')
                ->toArray();

            $taskData = new TaskData(
                title: $task['title'],
                description: $task['description'] ?? null,
                assignees: $assignees,
                category_id: null,
                organization_id: $organizationId,
                status: $task['status'] ?? TaskStatus::TODO->value,
                priority: $task['priority'] ?? null,
                due_date: $dueDate,
                type: TaskType::TASK->value,
                parent_id: $taskList->id,
                source: null
            );
            $task = $this->createTaskAction->handle(
                entity: $entity,
                data: $taskData
            );

            $createdTasks->push($task);
        }

        return $createdTasks;
    }

    /**
     * Find existing task list by ID or create a new one.
     */
    private function findOrCreateTaskList(
        ?string $taskListId,
        ?string $taskListName,
        string $organizationId,
        Taskable $entity
    ): Task {
        // If task list ID is provided, try to find existing task list
        if ($taskListId) {
            $existingTaskList = $entity
                ->tasks()
                ->where('id', $taskListId)
                ->where('type', TaskType::LIST->value)
                ->where('organization_id', $organizationId)
                ->first();

            if ($existingTaskList) {
                return $existingTaskList;
            }

            throw new \InvalidArgumentException(
                "Task list with ID {$taskListId} not found or not accessible"
            );
        }

        // If no ID provided, create a new task list (task_list_name is required in this case)
        if (!$taskListName) {
            throw new \InvalidArgumentException(
                'Task list name is required when creating a new task list'
            );
        }

        $taskListData = new TaskData(
            title: $taskListName,
            description: 'Smart task list created from transcript',
            assignees: null,
            category_id: null,
            organization_id: $organizationId,
            status: TaskStatus::TODO->value,
            priority: null,
            due_date: null,
            type: TaskType::LIST->value,
            parent_id: null,
            source: null
        );

        return $this->createTaskAction->handle(
            entity: $entity,
            data: $taskListData
        );
    }

    /**
     * Extract tasks from transcript (one task per line).
     */
    private function extractTasksFromTranscript(
        string $transcript,
        string $assignees
    ): array {
        $user = Auth::user();
        $userTimeZone = $user->timezone;
        $dateTime = Carbon::now($userTimeZone)->format('Y-m-d H:i:s');

        $prompt = <<<PROMPT
You are an intelligent assistant that extracts actionable tasks from free-form text dictated by a user. Your goal is to convert unstructured input into clean, structured tasks.

The user requesting the tasks is: {$user->name}. You can find the user's job title and job description in the pulse members listed below.

Think carefully and follow these rules:

---

## **General Rules**
- Interpret informal, shorthand, or incomplete phrasing and turn it into clear, well-structured tasks.
- Correct typos, improve phrasing, and fill in missing details **only if they can be reasonably inferred** from context.
- Never invent tasks, names, or details not present or inferable from the input.

Be strict with name matching. Mike is not the same as Michael, John is not the same as Jon, etc.

---

## **Task Fields Guidelines**
1. `title`:  
   - Always generate a **concise but descriptive title**.
   - Rewrite vague or terse phrasing into something clear and action-oriented.

2. `description`:  
   - Include a helpful description **only if** there is enough context in the input to elaborate meaningfully.
   - If no extra detail can be reliably added, leave this field as an empty string `""`.

3. **`assignees`**  
   - Extract mentioned assignees by name from the text if available.
   - If not explicitly mentioned, infer assignees **only if their role or job description clearly matches the task**.
   - Use only names from the Pulse Members list below. If the name is not listed, or the match is weak or ambiguous, leave as an empty array `[]`.
   - **Do not assign the task to the user automatically.** Assign them only if the task clearly falls under their responsibilities.
   - When in doubt, leave the assignee list empty.
   - Be strict with name matching. Mike is not the same as Michael, John is not the same as Jon, etc.

   Use the following role-to-task mapping to guide smart inference:
   - backend developer → database management, API development
   - qa tester → testing, bug reporting
   - product manager → product planning, roadmap management
   - designer → design, UI/UX
   - devops → infrastructure, deployment
   - sales → lead generation, outreach
   - marketing → branding, content, marketing campaigns
   - hr → recruitment, interviews, HR tasks

4. `task_type`:  
   - Always set this to `"TASK"`.

5. `due_date`:  
   - Parse relative dates like "today", "tomorrow", "next week" **based on** the current date `$dateTime`.
   - If no due date is mentioned or clearly implied, leave this as an empty string `""`.

6. `status`:  
   - The status of the task. Default to `"TODO"` if not specified.

7. `priority`:  
   - The priority of the task. Smartly infer the priority of the task based on the text, Look for keywords and phrases that indicate urgency. Default is 'LOW' if not specified and cannot be inferred.

---

## **Pulse Members**
$assignees

---

## **Input Text**
The user said:
{$transcript}

Start extracting the tasks from the text.
PROMPT;

        $params = [
            [
                'role' => 'user',
                'content' => $prompt,
            ],
        ];

        $taskSchema = TaskSchema::TaskSchema;
        $taskSchema['json_schema']['schema']['properties']['tasks']['items'][
            'properties'
        ]['assignees'] = [
            'type' => 'array',
            'description' =>
                'The assignees for the task, contains full name and ID of the person assigned to this task. If no assignees keep this empty array `[]`.',
            'items' => [
                'type' => 'object',
                'required' => ['id', 'name', 'reasoning'],
                'additionalProperties' => false,
                'properties' => [
                    'id' => [
                        'type' => 'string',
                        'description' =>
                            'The user id of the assignee in db. Keet this black if no id given. The real id of the user (from the pulse members list). Do not make up an id.',
                    ],
                    'name' => [
                        'type' => 'string',
                        'description' =>
                            'The name of the assignee, either full name (preffered if available) or first name or last name',
                    ],
                    'reasoning' => [
                        'type' => 'string',
                        'description' =>
                            'The reasoning behind the assignment of this task to this person. Either mentioned in the transcript or inferred from the job title and job description of the user.',
                    ],
                ],
            ],
        ];
        $taskSchema['json_schema']['schema']['properties']['tasks']['items'][
            'properties'
        ]['task_type'] = [
            'type' => 'string',
            'enum' => ['TASK'],
            'description' =>
                "Type of the task. Choose from: 'TASK'. Default is 'TASK'.",
        ];
        $taskSchema['json_schema']['schema']['properties']['tasks']['items'][
            'properties'
        ]['due_date'] = [
            'type' => ['string', 'null'],
            'description' =>
                'The due date of the task in ISO 8601 date format (YYYY-MM-DD), without time. If no due date is mentioned, leave it as an empty string (`""`).',
        ];

        $req = [
            'model' => 'gpt-4.1',
            'messages' => $params,
            'response_format' => $taskSchema,
            'temperature' => 0.5,
        ];
        $openAI = \OpenAI::client(config('zunou.openai.api_key'));
        $response = $openAI->chat()->create($req);
        Log::info($response['choices'][0]['message']['content']);
        return json_decode($response['choices'][0]['message']['content'], true);
    }

    /**
     * Create TaskData from a single task text line.
     */
    private function createTaskDataFromText(
        string $taskText,
        string $organizationId,
        string $parentId
    ): TaskData {
        // Clean up the task text
        $cleanText = $this->cleanTaskText($taskText);

        // Extract priority if present
        $priority = $this->extractPriority($cleanText);

        // Extract due date if present (basic implementation)
        $dueDate = $this->extractDueDate($cleanText);

        // Use the cleaned text as title, with a reasonable limit
        $title =
            strlen($cleanText) > 255
                ? substr($cleanText, 0, 252) . '...'
                : $cleanText;

        // Ensure title is not empty
        if (empty(trim($title))) {
            $title = 'Untitled Task';
        }

        return new TaskData(
            title: $title,
            description: null,
            assignees: null,
            category_id: null,
            organization_id: $organizationId,
            status: TaskStatus::TODO->value,
            priority: $priority,
            due_date: $dueDate,
            type: TaskType::TASK->value,
            parent_id: $parentId,
            source: null
        );
    }

    /**
     * Clean task text by removing common prefixes and formatting.
     */
    private function cleanTaskText(string $text): string
    {
        $text = trim($text);

        // Remove common task prefixes
        $text = preg_replace('/^[\-\*\+]\s*/', '', $text);
        $text = preg_replace('/^\d+\.\s*/', '', $text);
        $text = preg_replace('/^TODO:?\s*/i', '', $text);
        $text = preg_replace('/^\[\s*\]\s*/', '', $text);
        $text = preg_replace('/^\[x\]\s*/i', '', $text);

        return trim($text);
    }

    /**
     * Extract priority from task text (basic implementation).
     */
    private function extractPriority(string $text): ?TaskPriority
    {
        if (preg_match('/\b(urgent|high priority|important)\b/i', $text)) {
            return TaskPriority::HIGH;
        }

        if (preg_match('/\b(low priority|minor)\b/i', $text)) {
            return TaskPriority::LOW;
        }

        return null;
    }

    /**
     * Extract due date from task text (basic implementation).
     */
    private function extractDueDate(string $text): ?\Illuminate\Support\Carbon
    {
        // This is a basic implementation - could be enhanced with more sophisticated date parsing
        if (preg_match('/\b(today|tomorrow|next week)\b/i', $text)) {
            return match (true) {
                str_contains(strtolower($text), 'today') => now(),
                str_contains(strtolower($text), 'tomorrow') => now()->addDay(),
                str_contains(strtolower($text), 'next week')
                    => now()->addWeek(),
                default => null,
            };
        }

        return null;
    }

    private function resolveAssignees(array $assignees, string $pulseId): array
    {
        return PulseMember::query()
            ->where('pulse_id', $pulseId)
            ->whereHas('user', function ($query) use ($assignees) {
                $query->where(function ($subQuery) use ($assignees) {
                    foreach ($assignees as $name) {
                        $subQuery->orWhere('name', 'ILIKE', "%{$name}%");
                    }
                });
            })
            ->with([
                'user:id,name,email',
                'organizationGroups:id,name,description',
            ])
            ->get()
            ->toArray();
    }

    private function searchAssignees(
        array $foundAssignees,
        array $assignees
    ): ?array {
        $assigneeList = [];

        foreach ($assignees as $assignee) {
            foreach ($foundAssignees as $assigneeDB) {
                $fullName = strtolower($assigneeDB['user']['name']);

                if (str_contains($fullName, strtolower($assignee))) {
                    $assigneeList[] = $assigneeDB['user']['id'];
                }
            }
        }

        return empty($assigneeList) ? null : $assigneeList;
    }

    public function formatAssignees(Collection $assignees): string
    {
        // map only get the name, id, job title, job description, responsibilities
        $parsedAssignees = $assignees->map(function ($assignee) {
            return [
                'id' => $assignee->user->id,
                'name' => $assignee->user->name,
                'job_title' => $assignee->job_title,
                'job_description' => $assignee->job_description,
                'responsibilities' => $assignee->responsibilities,
            ];
        });

        return $parsedAssignees->toJson();
    }
}
