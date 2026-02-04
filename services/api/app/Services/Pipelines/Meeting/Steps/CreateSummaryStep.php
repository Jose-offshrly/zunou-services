<?php

namespace App\Services\Pipelines\Meeting\Steps;

use App\Enums\DataSourceStatus;
use App\Jobs\PostProcessSummaryJob;
use App\Models\DataSource;
use App\Models\Summary;
use App\Models\Transcript;
use App\Schemas\MeetingSchema;
use App\Services\Agents\Handlers\DataSourceHandler;
use App\Services\Agents\Helpers\MarkdownParser;
use App\Services\Agents\Shared\TaskPipeline;
use App\Services\Agents\SubAgents\TaskAgent;
use App\Services\BedrockService;
use App\Services\Pipelines\Contracts\PipelineStepInterface;
use App\Services\Pipelines\Meeting\MeetingSummaryContext;
use GuzzleHttp\Promise\Utils;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class CreateSummaryStep implements PipelineStepInterface
{
    public function handle($ctx)
    {
        if (!$ctx instanceof MeetingSummaryContext) {
            throw new \TypeError('Expected MeetingSummaryContext');
        }

        $start = microtime(true);
        if (!$ctx->meeting_info || !isset($ctx->meeting_info['id'])) {
            Log::error('[Pipeline Step: CreateSummaryStep] No meeting information available');
            $ctx->success = false;
            $ctx->error = 'No meeting information available';
            $ctx->result = null;
            return $ctx;
        }

        $dataSourceId = $ctx->meeting_info['data_source_id'];

        $existingSummary = Summary::where('data_source_id', $dataSourceId)->first();
        if ($existingSummary) {
            Log::info('[Pipeline Step: CreateSummaryStep] Existing summary found, returning it', [
                'summary_id' => $existingSummary->id,
            ]);
            $ctx->success = true;
            $ctx->result = json_encode([
                'summary' => "The {$existingSummary->name} Summary is now available!",
                'content' => [
                    [
                        'summary_id' => $existingSummary->id,
                        'text'       => $existingSummary->name,
                    ],
                ],
            ]);
            return $ctx;
        }

        $dataSource = DataSource::withTrashed()->find($dataSourceId);
        if (!$dataSource) {
            Log::error('[Pipeline Step: CreateSummaryStep] Data source not found', ['data_source_id' => $dataSourceId]);
            $ctx->success = false;
            $ctx->error = 'No data source was found with that ID.';
            $ctx->result = null;
            return $ctx;
        }

        if ($dataSource->status === DataSourceStatus::Deleted->value) {
            Log::warning('[Pipeline Step: CreateSummaryStep] Data source deleted', ['data_source_id' => $dataSourceId]);
            $ctx->success = false;
            $ctx->error = 'This meeting record has been deleted and is no longer available.';
            $ctx->result = null;
            return $ctx;
        }

        $transcript = Transcript::where('data_source_id', $dataSourceId)->first();
        $dataSourceContent = $transcript?->content;

        if (!$dataSourceContent) {
            Log::info('[Pipeline Step: CreateSummaryStep] Transcript not found, retrieving from data source handler');
            $dataSourceHandler = new DataSourceHandler($ctx->organization_id, $ctx->pulse_id);
            $dataSourceContent = $dataSourceHandler->retrieveFullText($dataSourceId);
        }

        if (!$dataSourceContent) {
            Log::warning('[Pipeline Step: CreateSummaryStep] Unable to retrieve meeting content', ['data_source_id' => $dataSourceId]);
            $ctx->success = false;
            $ctx->error = 'Unable to retrieve meeting content. The meeting may not be fully processed yet.';
            $ctx->result = null;
            return $ctx;
        }

        $startSummaryTime = microtime(true);
        $summaryObj = $this->generateSummaryConcurrently($dataSourceContent);
        $summaryTimeDiff = microtime(true) - $startSummaryTime;
        Log::debug('SummaryObj', ['summaryObj' => $summaryObj]);
        Log::debug('MeetingAgent: generateSummaryConcurrently time: ' . $summaryTimeDiff . ' seconds');

        $startActionItemsTime = microtime(true);

        $actionItems = $summaryObj['action_items'] ?? [];
        $DisableAutoAssign = env('DISABLE_TASK_AUTO_ASSIGN', false);
        if (!empty($actionItems) && !$DisableAutoAssign) {
            Log::info('[Pipeline Step: CreateSummaryStep] Processing action items', [
                'count' => count($actionItems),
            ]);
            $taskPipeline = new TaskPipeline($ctx->organization_id, $ctx->pulse_id);
            $statusMapping = [
                'TODO'       => 'Not Started',
                'INPROGRESS' => 'In Progress',
                'COMPLETED'  => 'Done',
            ];
    
            $priorityMapping = [
                'LOW'    => 'Low',
                'MEDIUM' => 'Medium',
                'HIGH'   => 'High',
                'URGENT' => 'Urgent',
            ];
    
            $pipelineResult = $taskPipeline->run($actionItems, true, false);
            Log::debug(
                '[Task Manager Agent] Task pipeline result',
                $pipelineResult,
            );
    
            $tasks = $this->validateTasks($pipelineResult['tasks']);
    
            $tasks = array_map(function ($task) use (
                $statusMapping,
                $priorityMapping
            ) {
                $rawStatus      = $task['status']            ?? null;
                $task['status'] = $statusMapping[$rawStatus] ?? 'Not Started';
    
                $rawPriority      = $task['priority']              ?? null;
                $task['priority'] = $priorityMapping[$rawPriority] ?? 'Low';
    
                return $task;
            }, $tasks);
    
            $actionItemsTime = microtime(true) - $startActionItemsTime;
            Log::info('[PERF] CreateSummaryStep: processMeetingTasks', [
                'time_seconds' => round($actionItemsTime, 3),
                'action_items_count' => count($summaryObj['action_items']),
            ]);
        }

        $summary = Summary::create([
            'name' => ($summaryObj['metadata']['meeting_name'] ?? 'Meeting') . ' Summary',
            'pulse_id' => $ctx->pulse_id,
            'user_id' => $ctx->user->id,
            'data_source_id' => $dataSourceId,
            'date' => $summaryObj['metadata']['meeting_date'] ?? now(),
            'attendees' => $summaryObj['metadata']['attendees'] ?? [],
            'action_items' => json_encode($actionItems),
            'potential_strategies' => json_encode($summaryObj['potential_strategy'] ?? []),
            'summary' => MarkdownParser::clean($summaryObj['summary']),
        ]);
        $end = microtime(true);
        Log::debug('MeetingAgent: generateMeetingSummaryHandler time: ' . ($end - $start) . ' seconds');

        Log::info('[Pipeline Step: CreateSummaryStep] Summary created', [
            'summary_id' => $summary->id,
            'data_source_id' => $dataSourceId,
        ]);

        $ctx->success = true;
        $ctx->result = json_encode([
            'summary' => $summaryObj['metadata']['headline'],
            'content' => [
                [
                    'summary_id' => $summary->id,
                    'text'       => $summary->name,
                ],
            ],
        ]);

        PostProcessSummaryJob::dispatch($summary->id, $ctx->organization_id, $ctx->pulse_id)->onQueue('default');

        return $ctx;
    }

    public function getName(): string
    {
        return class_basename(static::class);
    }

    protected function generateSummaryConcurrently(string $meetingBody): array
    {
        $summaryPrompt = <<<PROMPT
You are a professional business assistant skilled in summarizing meeting transcripts into clear, structured, and professional summaries.

First, analyze the overall structure and nature of the meeting based on the transcript.  
Determine whether it's a standup, planning session, problem-solving discussion, or another type.  
Use this understanding to segment the summary appropriately — for example, by presenter, topic area, or decision point.  
Avoid summarizing blindly in chronological order if there's a more meaningful way to organize the content.
Ensure that the summary reads smoothly from top to bottom, maintaining a logical flow of discussion while keeping key points clear and distinct.

Your task is to produce **two key outputs**:

---

### 1. Comprehensive Meeting Summary:
A summary of the meeting that includes:
- **Major discussion points** covered
- **Decisions made** during the meeting
- **Next steps** or **key takeaways** for the team
- Exclude irrelevant details and avoid repetition
- The summary should be clear, concise, and easy to scan
- Ensure the summary is complete, even if it becomes long, but do not artificially limit the length

Use a **numbered list** format for the summary, with each point clearly separated and easy to read.

For each main point, if necessary, include **bulleted subpoints** that provide additional context such as:
- Explanations, insights, or clarifications  
- Decisions made or actions discussed  
- People or teams mentioned (if applicable)  
- Timelines, follow-ups, or scheduling notes (if applicable)

---

### 2. Potential Strategies:
A list of **2-3 potential strategies** or **ideas** that were discussed during the meeting. These should be actionable and aimed at addressing challenges or achieving business goals. Each strategy should be a concise string description (not an object).

Ensure the potential strategies are practical and aligned with the meeting's goals.

---

The summary and potential strategies should cover **all critical points** without omitting important information.  
Do not invent or stretch content — only include what is actually present in the transcript.

**IMPORTANT**: Return your response as a valid JSON object with the following structure:
{
  "summary": "your markdown summary here",
  "potential_strategy": ["strategy 1 as a string", "strategy 2 as a string", "strategy 3 as a string"],
  "metadata": {
    "headline": "The [meeting name] Summary is now available! Highlight key: [key highlight]",
    "meeting_name": "meeting name",
    "meeting_date": "ISO 8601 date string",
    "attendees": "list of attendees or 'No attendees'"
  }
}
PROMPT;

        $actionItemsPrompt = <<<PROMPT
You are a professional business assistant skilled in identifying action items from meeting transcripts.

Your task is to extract **all action items** discussed during the meeting. Each item should include:
- **Task description**: What needs to be done
- **Assigned person/team**: Who is responsible for completing the task
- **Deadline**: The date by which the task should be completed (if mentioned)
- **Relevant context/notes**: Any additional context or notes that are necessary to complete the task (if applicable)

Ensure the action items are comprehensive, well-organized, and include all important details. Each action item should be specific, with clear ownership and deadlines if provided.

Do not invent tasks — only include what is actually mentioned in the transcript.  
Use clear, concise language and make it easy for the team to act on each item.

**IMPORTANT**: Return your response as a valid JSON object with the following structure:
{
  "action_items": [
    {
      "name": "task title",
      "description": "task description",
      "status": "pending",
      "priority": "medium",
      "due_date": "ISO 8601 date or null",
      "assignees": ["person1", "person2"] or ["EVERYONE"]
    }
  ]
}
PROMPT;
        $bedrockModel = env('AMAZON_BEDROCK_MODEL', null);
        if ($bedrockModel) {
            Log::debug('[Pipeline Step: CreateSummaryStep] Generating summary with Bedrock model', ['model' => $bedrockModel]);
            $result = $this->generateSummaryBedrock($meetingBody, $summaryPrompt, $actionItemsPrompt);
        } else {
            Log::debug('[Pipeline Step: CreateSummaryStep] Generating summary with OpenAI model', ['model' => 'gpt-4.1-mini']);
            $result = $this->generateSummaryOpenAI($meetingBody, $summaryPrompt, $actionItemsPrompt);
        }

        $summaryData = json_decode($result['summary'], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('[Pipeline Step: CreateSummaryStep] Failed to parse summary JSON', [
                'error' => json_last_error_msg(),
                'content' => $result['summary'],
            ]);
            throw new \RuntimeException('Failed to parse summary response');
        }

        $actionData = json_decode($result['action_items'], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('[Pipeline Step: CreateSummaryStep] Failed to parse action items JSON', [
                'error' => json_last_error_msg(),
                'content' => $result['action_items'],
            ]);
            throw new \RuntimeException('Failed to parse action items response');
        }

        $result = [
            'summary' => $summaryData['summary'] ?? '',
            'potential_strategy' => $summaryData['potential_strategy'] ?? [],
            'metadata' => $summaryData['metadata'],
            'action_items' => $this->transformActionItems($actionData['action_items'] ?? []),
        ];

        Log::debug('Meeting Summary Response (Concurrent)', ['message' => $result]);

        return $result;
    }

    protected function transformActionItems(array $actionItems): array
    {
        return array_map(function ($task) {
            $task['title'] = $task['name'];
            unset($task['name']);
            if (in_array('EVERYONE', $task['assignees'])) {
                $task['is_for_everyone'] = true;
                $task['assignees'] = [];
                return $task;
            }
            $task['assignees'] = array_map(fn($assignee) => ['name' => $assignee], $task['assignees'] ?? []);
            return $task;
        }, $actionItems);
    }

    protected function generateSummaryBedrock(string $meetingBody, string $summaryPrompt, string $actionItemsPrompt): array
    {
        $bedrockModel = env('AMAZON_BEDROCK_MODEL', 'anthropic.claude-3-haiku-20240307-v1:0');

        $summaryFunction = [
            'name' => 'extractMeetingSummary',
            'description' => 'Extracts a summary from a meeting transcript',
            'parameters' => [
                'type' => 'object',
                'properties' => MeetingSchema::GENERATED_SUMMARY_DATA_ONLY["json_schema"]["schema"]["properties"],
                'required' => array_keys(MeetingSchema::GENERATED_SUMMARY_DATA_ONLY["json_schema"]["schema"]["properties"]),
            ],
        ];

        $actionItemsFunction = [
            'name' => 'extractActionItems',
            'description' => 'Extracts action items from a meeting transcript',
            'parameters' => [
                'type' => 'object',
                'properties' => MeetingSchema::GENERATED_ACTION_ITEMS_DATA["json_schema"]["schema"]["properties"],
                'required' => array_keys(MeetingSchema::GENERATED_ACTION_ITEMS_DATA["json_schema"]["schema"]["properties"]),
            ],
        ];

        $summaryFullPrompt = "{$summaryPrompt}\n\nGenerate summary:\n\n{$meetingBody}";
        $actionItemsFullPrompt = "{$actionItemsPrompt}\n\nGenerate action items:\n\n{$meetingBody}";

        // Make two structured async calls
        $promises = [
            BedrockService::createStructuredAsync(
                $bedrockModel,
                $summaryFullPrompt,
                $summaryFunction
            ),
            BedrockService::createStructuredAsync(
                $bedrockModel,
                $actionItemsFullPrompt,
                $actionItemsFunction
            ),
        ];

        // Wait for all promises to resolve
        try {
            $results = Utils::unwrap($promises);
            $summaryResponse = $results[0];
            $actionItemsResponse = $results[1];
        } catch (\Exception $e) {
            Log::error('[Pipeline Step: CreateSummaryStep] Bedrock structured async invocation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \RuntimeException('Failed to generate meeting summary or action items: ' . $e->getMessage());
        }

        // Extract tool arguments from responses
        $summaryArgs = $this->extractToolArguments($summaryResponse);
        $actionItemsArgs = $this->extractToolArguments($actionItemsResponse);

        if (!$summaryArgs) {
            Log::error('[Pipeline Step: CreateSummaryStep] Summary generation failed - no tool arguments', [
                'response' => $summaryResponse,
            ]);
            throw new \RuntimeException('Failed to generate meeting summary - no tool arguments in response');
        }

        if (!$actionItemsArgs) {
            Log::error('[Pipeline Step: CreateSummaryStep] Action items generation failed - no tool arguments', [
                'response' => $actionItemsResponse,
            ]);
            throw new \RuntimeException('Failed to generate action items - no tool arguments in response');
        }

        // Convert tool arguments to JSON strings
        $summaryText = json_encode($summaryArgs);
        $actionText = json_encode($actionItemsArgs);

        Log::debug('[Pipeline Step: CreateSummaryStep] Summary extracted', ['summary_args' => $summaryArgs]);
        Log::debug('[Pipeline Step: CreateSummaryStep] Action items extracted', ['action_items_args' => $actionItemsArgs]);

        return [
            'summary' => $summaryText,
            'action_items' => $actionText,
        ];
    }

    /**
     * Extract tool arguments from Bedrock converse response
     */
    protected function extractToolArguments(array $response): ?array
    {
        if (isset($response['output']['message']['content'])) {
            $content = $response['output']['message']['content'];
            if (is_array($content)) {
                foreach ($content as $block) {
                    if (isset($block['toolUse']['input'])) {
                        return $block['toolUse']['input'];
                    }
                }
            }
        }
        return null;
    }

    protected function generateSummaryOpenAI(string $meetingBody, string $summaryPrompt, string $actionItemsPrompt): array
    {
        $commonHeaders = [
            'Authorization' => 'Bearer ' . config('zunou.openai.api_key'),
        ];

        $summaryRequest = [
            'model'           => "gpt-4.1-mini",
            'temperature'     => 0.5,
            'response_format' => MeetingSchema::GENERATED_SUMMARY_DATA_ONLY,
            'messages'        => [
                ['role' => 'system', 'content' => $summaryPrompt],
                ['role' => 'user',   'content' => "Generate summary:\n\n{$meetingBody}"],
            ],
        ];

        $actionRequest = [
            'model'           => "gpt-4.1-mini",
            'temperature'     => 0.5,
            'response_format' => MeetingSchema::GENERATED_ACTION_ITEMS_DATA,
            'messages'        => [
                ['role' => 'system', 'content' => $actionItemsPrompt],
                ['role' => 'user',   'content' => "Generate action items:\n\n{$meetingBody}"],
            ],
        ];

        $responses = Http::pool(fn (Pool $pool) => [
            $pool->as('summary')
                ->withHeaders($commonHeaders)
                ->acceptJson()
                ->post('https://api.openai.com/v1/chat/completions', $summaryRequest),

            $pool->as('action_items')
                ->withHeaders($commonHeaders)
                ->acceptJson()
                ->post('https://api.openai.com/v1/chat/completions', $actionRequest),
        ]);

        $summaryText = $responses['summary']->successful()
            ? $responses['summary']->json('choices.0.message.content')
            : null;

        $actionText = $responses['action_items']->successful()
            ? $responses['action_items']->json('choices.0.message.content')
            : null;

        if (!$summaryText) {
            Log::error('[Pipeline Step: CreateSummaryStep] Summary generation failed', [
                'status' => $responses['summary']->status(),
                'body'   => $responses['summary']->body(),
            ]);
            throw new \RuntimeException('Failed to generate meeting summary');
        }

        if (!$actionText) {
            Log::error('[Pipeline Step: CreateSummaryStep] Action items generation failed', [
                'status' => $responses['action_items']->status(),
                'body'   => $responses['action_items']->body(),
            ]);
            throw new \RuntimeException('Failed to generate action items');
        }

        return [
            'summary' => $summaryText,
            'action_items' => $actionText,
        ];
    }

    public function validateTasks($tasks)
    {
        return array_map(function ($task) {
            $assignees = ! empty($task['assignees']) ? $task['assignees'] : null;
            if ($assignees) {
                $assignees = $this->processAssignees($assignees);
            }

            $dueDate = ! empty($task['due_date']) ? $task['due_date'] : null;

            // Ensure title is not empty
            $title = $task['title'] ?? '';
            if (empty(trim($title))) {
                $title = 'Untitled Task';
            }

            return [
                'title'       => $title,
                'description' => ! empty($task['description'])
                    ? $task['description']
                    : null,
                'assignees' => $assignees,
                'status'    => ! empty($task['status']) ? $task['status'] : 'TODO',
                'priority'  => ! empty($task['priority'])
                    ? $task['priority']
                    : 'MEDIUM',
                'due_date'  => $this->processDueDate($dueDate),
                'task_type' => ! empty($task['task_type'])
                    ? $task['task_type']
                    : 'TASK',
                'parent_id' => ! empty($task['parent_id'])
                    ? $task['parent_id']
                    : null,
            ];
        }, $tasks);
    }

    protected function processAssignees(array $assignees): array
    {
        return array_filter(
            array_map(function ($assignee) {
                if (empty($assignee['name'])) {
                    return null;
                }

                if (
                    ! empty($assignee['id']) && ! Uuid::isValid($assignee['id'])
                ) {
                    $assignee['id'] = null;
                }
                return $assignee;
            }, $assignees),
        );
    }

    protected function processDueDate($dueDate)
    {
        if (empty($dueDate)) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($dueDate)->startOfDay();
        } catch (\Exception $e) {
            return null;
        }
    }
}

