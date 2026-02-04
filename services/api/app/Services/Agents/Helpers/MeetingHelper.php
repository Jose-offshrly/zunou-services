<?php

namespace App\Services\Agents\Helpers;

use App\Models\Meeting;
use App\Models\Notification;
use App\Models\Pulse;
use App\Models\Summary;
use App\Models\User;
use App\Notifications\PulseNotification;
use App\Schemas\MeetingSchema;
use App\Services\Agents\Traits\LLMResponseTrait;
use App\Services\OpenAIService;
use App\Services\VectorDBService;
use Carbon\Carbon;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MeetingHelper
{
    use LLMResponseTrait;

    protected $vectorDBService;
    private static $gazzleClient;
    protected $pulse;
    protected $openaiService;
    protected $openAI;

    public function __construct($pulse = null)
    {
        $this->vectorDBService = new VectorDBService();
        $this->pulse           = $pulse;
        $this->openaiService   = new OpenAIService($pulse);
        $this->openAI          = \OpenAI::client(config('zunou.openai.api_key'));
        if (! self::$gazzleClient) {
            self::$gazzleClient = new Client([
                'headers' => ['Content-Type' => 'application/json'],
            ]);
        }
    }

    public function generateSummary(string $meetingBody, string $userId)
    {
        // $user        = User::find($userId);
        // $userContext = $user->getUserContext();
        $prompt = <<<PROMPT
You are a professional business assistant skilled in summarizing meeting transcripts into clear, structured, and professional summaries.

First, analyze the overall structure and nature of the meeting based on the transcript.  
Determine whether it's a standup, planning session, problem-solving discussion, or another type.  
Use this understanding to segment the summary appropriately — for example, by presenter, topic area, or decision point.  
Avoid summarizing blindly in chronological order if there's a more meaningful way to organize the content.
Ensure that the summary reads smoothly from top to bottom, maintaining a logical flow of discussion while keeping key points clear and distinct.

Your task is to produce **three key outputs**:

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

For each main point, If only necessary, include one or more **bulleted subpoints** that provide additional context such as:
- Explanations, insights, or clarifications  
- Decisions made or actions discussed  
- People or teams mentioned (if applicable)  
- Timelines, follow-ups, or scheduling notes (if applicable)

---

### 2. Action Items:
A list of **action items** that were discussed and assigned during the meeting. Each item should include:
- **Task description**: What needs to be done
- **Assigned person/team**: Who is responsible for completing the task
- **Deadline**: The date by which the task should be completed (if mentioned)
- **Relevant context/notes**: Any additional context or notes that are necessary to complete the task (if applicable)

Ensure the action items are comprehensive, well-organized, and include all important details. Each action item should be specific, with clear ownership and deadlines (if provided).

---

### 3. Potential Strategies:
A list of **potential strategies** or **ideas** that were discussed during the meeting. These should be actionable and aimed at addressing challenges or achieving business goals. Each strategy should include:
- **Strategy description**: What the strategy is
- **Objective**: What the strategy aims to achieve
- **Next steps**: What actions are needed to implement the strategy (if mentioned)

Ensure the potential strategies are practical and aligned with the meeting's goals.

---

The summary, action items, and potential strategies should cover **all critical points** without omitting important information.

Do not limit the length of the summary—provide as much detail as necessary while maintaining clarity.
Include all key points and action items from the meeting.  
If there are 20-30 action items or summary key points, include all of them.  
However, do not invent or stretch content to match specific numbers — only include what is actually present in the transcript.  
Avoid generating a fixed number of items unless that number naturally reflects the meeting content.

REVIEW YOUR RESPONSE BEFORE RETURNING FINAL RESPONSE, MAKE SURE ALL INSTRUCTIONS IS ADHERED.
PROMPT;

        $userMessages = [
            [
                'role'    => 'system',
                'content' => $prompt,
            ],
            [
                'role'    => 'user',
                'content' => "Create Summary for this meeting transcript: \n $meetingBody",
            ],
        ];

        $toolModel = AgentConfig::toolModel(
            'meeting',
            'generateMeetingSummary',
        );

        $response = $this->openaiService->createChatCompletion($userMessages, [
            'response_format' => MeetingSchema::GENERATED_SUMMARY_DATA,
            'model'           => "gpt-4.1-mini",
            'temperature'     => 0.5,
        ]);

        $message = $response['choices'][0]['message'];

        
        $arguments = json_decode($message['content'], true);
        
        $arguments['action_items'] = array_map(function ($task) {
            $task['title'] = $task['name'];
            unset($task['name']);
            if (in_array('EVERYONE', $task['assignees'])) {
                $task['is_for_everyone'] = true;
                $task['assignees'] = [];
                return $task;
            }
            $task['assignees'] = array_map(fn($assignee) => ['name' => $assignee], $task['assignees'] ?? []);
            return $task;
        }, $arguments['action_items']);

        Log::debug('Meeting Summary Response', ['message' => $arguments]);
        
        return $arguments;
    }

    public function generateTextSummary($arguments, $pulseId, $userId)
    {
        $user        = User::find($userId);
        $userContext = $user->getUserContext();

        if ($arguments['summary_type'] === 'Chat Summary') {
            $prompt = <<<PROMPT
I want you to act as a meeting assistant. Summarize the following meeting discussion into a concise and conversational Chat Summary.
Highlight key points, decisions, and action items using short bullet points.
Keep the tone casual and aligned with the pulse's mission. Avoid excessive details or formal formatting.
PROMPT;
        } else {
            $prompt = <<<PROMPT
I want you to act as a meeting assistant and generate a Formatted Summary of a Meeting.
Use a professional tone and follow this markdown template:

1. Agenda: Provide a clear list of topics discussed.
2. Discussion Points: Summarize each topic with key details.
3. Decisions Made: Clearly state any decisions agreed upon.
4. Action Items: List assigned tasks, responsible individuals, and deadlines.

Ensure the output is clear, organized, and suitable for official documentation.
PROMPT;
        }
        $prompt .= "Always return the result summary only, Do not add anything before or after the summary.
                    Do not provide greetings or add follow up questions at the end.
                    Do not add the title or any heading to the markdown.
                    Make sure the markdown is correct and properly structured. 
                    \nPersonalized the summary based on this user context and preferences:  " .
            $userContext;

        $summary = Summary::select(
            'name',
            'date',
            'attendees',
            'data_source_id',
            'summary',
        )->find($arguments['summary_id']);

        $summaryType  = $arguments['summary_type'];
        $originalName = $summary->name;

        $meetingBody = 'Original Meeting record: ' . $summary->toJson();

        $userMessages = [
            [
                'role'    => 'system',
                'content' => $prompt,
            ],
            [
                'role'    => 'user',
                'content' => "Meeting Content: \n $meetingBody",
            ],
        ];

        $functions = [
            [
                'name'        => 'extract_summary',
                'description' => 'Use this tool to extract summary. Always call this tool right after generating summary. summary content must be in markdown format',
                'parameters'  => [
                    'properties' => [
                        'summary' => [
                            'description' => 'The resulting summary in markdown',
                            'type'        => 'string',
                        ],
                        'headline' => [
                            'type'        => 'string',
                            'description' => 'Short headline with short description for summary. strictly maintain this structure at all times "The [title of meeting] Summary is now available! Highlight key: [key_highlight]". fix the repeating words if theres any',
                        ],
                        'new_name' => [
                            'type'        => 'string',
                            'description' => "Modify this original name '$originalName', add $summaryType suffix to it. Avoid duplicates in words specially 'summary' since the source is also summary. Do not add dates in the name",
                        ],
                        'potential_strategy' => [
                            'type'  => 'array',
                            'items' => [
                                'type' => 'string',
                            ],
                            'description' => 'A list of 2-3 actionable strategies discussed during the meeting. These should reflect key suggestions, ideas, or plans that could be implemented to address challenges or achieve goals.',
                        ],
                    ],
                    'required' => [
                        'summary',
                        'headline',
                        'new_name',
                        'potential_strategy',
                    ],
                    'type' => 'object',
                ],
            ],
        ];

        $function_call = ['name' => 'extract_summary'];
        $toolModel     = AgentConfig::toolModel(
            'meeting',
            'viewAndCreatePersonalizedVersionOfMeetingSummary',
        );
        $response = $this->openaiService->createChatCompletion($userMessages, [
            'model'         => $toolModel,
            'functions'     => $functions,
            'function_call' => $function_call,
        ]);

        $message       = $response['choices'][0]['message'];
        $jsonArguments = $message['function_call']['arguments'];

        $arguments = json_decode($jsonArguments, true);

        $createdSummary = Summary::create([
            'name'                 => $arguments['new_name'],
            'data_source_id'       => $summary->data_source_id,
            'pulse_id'             => $pulseId,
            'user_id'              => $userId,
            'date'                 => $summary->date,
            'attendees'            => $summary->attendees,
            'potential_strategies' => json_encode(
                $arguments['potential_strategy'],
            ),
            'summary' => MarkdownParser::clean($arguments['summary']),
        ]);

        $createdSummaryJSON = $createdSummary->toJson();
        $responseContent    = json_encode([
            'summary' => $arguments['headline'],
            'content' => [
                [
                    'summary_id' => $createdSummary->id,
                    'text'       => $arguments['new_name'],
                ],
            ],
        ]);

        return <<<EOD
Here's the generated personalized summary:
$createdSummaryJSON

However, return just this to the user.
$responseContent

Make sure do not alter the formatting and values.
EOD;
    }

    private function hasToolCalls(array $message): bool
    {
        return isset($message['tool_calls']) && is_array($message['tool_calls']);
    }

    public function getMeetingList(
        string $userId,
        string $pulseId,
        ?string $fromDate,
        ?string $toDate,
        ?int $limit,
        ?int $skip,
        ?string $keywords = null,
        ?bool $byCreatedAt = false,
    ) {
        try {
            $query = Meeting::where('user_id', $userId)->where(
                'pulse_id',
                $pulseId,
            );

            if (! empty($fromDate)) {
                if ($byCreatedAt) {
                    $fromDateTime = date(
                        'Y-m-d 00:00:00',
                        strtotime($fromDate),
                    );
                    $query->where('created_at', '>=', $fromDateTime);
                } else {
                    $fromDateTime = date(
                        'Y-m-d 00:00:00',
                        strtotime($fromDate),
                    );
                    $query->where('date', '>=', $fromDateTime);
                }
            }

            if (! empty($toDate)) {
                if ($byCreatedAt) {
                    $toDateTime = date('Y-m-d 23:59:59', strtotime($toDate));
                    $query->where('created_at', '<=', $toDateTime);
                } else {
                    $toDateTime = date('Y-m-d 23:59:59', strtotime($toDate));
                    $query->where('date', '<=', $toDateTime);
                }
            }

            if (! empty($keywords)) {
                $searchTerms = array_map('trim', explode(',', $keywords));
                $query->where(function ($q) use ($searchTerms) {
                    foreach ($searchTerms as $term) {
                        $q->whereRaw('LOWER(title) LIKE ?', [
                            '%' . strtolower($term) . '%',
                        ]);
                    }
                });
            }

            $query->select(
                'id',
                'meeting_id',
                'pulse_id',
                'user_id',
                'title',
                'date',
                'is_viewable',
            );

            $query->orderBy('date', 'desc');
            $result = $query->skip($skip)->take($limit)->get();

            return $result;
        } catch (\Exception $e) {
            Log::error(
                '[MeetingHelper::getMeetingList] Error getting meeting list',
                [
                    'message' => $e->getMessage(),
                    'trace'   => $e->getTraceAsString(),
                ],
            );

            return null;
        }
    }

    public function sendSummaryNotesNotificationOnEmplyees(
        string $description,
        string $type,
        string $pulseId,
        string $summary_id,
    ) {
        try {
            // check if valid summary id
            $summary = Summary::find($summary_id);

            $input = [
                'description'  => $description,
                'type'         => $type,
                'notifiableId' => $pulseId,
                'summary_id'   => $summary->id,
                'kind'         => 'summary_option',
            ];

            $validator = Validator::make($input, [
                'description'  => 'required|string',
                'type'         => 'required|string',
                'notifiableId' => 'required|string',
                'summary_id'   => 'required|exists:summaries,id',
                'kind'         => 'required|string',
            ]);

            if ($validator->fails()) {
                return 'Cannot continue, the tool received invalid values. Make sure to pass valid values especially correct summary_id';
            }

            $this->createPulseNotification($input);

            return 'Success! Team members have been notified';
        } catch (\Exception $e) {
            Log::error(
                '[GeneralHelper::sendSummaryNotesNotificationOnEmplyees] Error sending notification',
                [
                    'message' => $e->getMessage(),
                    'trace'   => $e->getTraceAsString(),
                ],
            );

            return 'Failed to send notification';
        }
    }

    private function createPulseNotification(array $input): Notification
    {
        $pulse = Pulse::findOrFail($input['notifiableId']);
        $pulse->notify(
            new PulseNotification(
                description: $input['description'],
                kind: $input['kind'],
                metadata: [],
                summary_id: $input['summary_id'],
            ),
        );

        return $pulse->notifications()->first();
    }

    public function queryMeetingsWithLLM(
        string $userId,
        string $pulseId,
        string $userPrompt,
    ) {
        $prompt = <<<PROMPT
You are a meeting query assistant. Given a user's request, extract a JSON object with:

- **intent**: one of "latest", "filter", or "all".
  - Use "latest" for queries like "latest meeting" or "most recent meetings".
  - Use "filter" for queries that refer to specific topics or time ranges.
  - Use "all" if no filters are mentioned.
- **keywords** (optional): array of phrases to search in the meeting title.
- **from_date** (optional): ISO format date (YYYY-MM-DD) for the start range.
- **to_date** (optional): ISO format date (YYYY-MM-DD) for the end range.

Only return valid JSON, no explanation. Example output:
{
  "intent": "latest",
  "keywords": [],
  "from_date": null,
  "to_date": null
}
PROMPT;

        $response = $this->openAI->chat()->create([
            'model'    => config('zunou.openai.reasoning_model'),
            'messages' => [
                ['role' => 'system', 'content' => $prompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
        ]);

        $filters = json_decode(
            $response['choices'][0]['message']['content'],
            true,
        );
        Log::info(['LLM filters' => $filters]);

        $query = Meeting::where('pulse_id', $pulseId)
            ->whereNotNull('data_source_id')
            ->where('user_id', $userId);

        if (! empty($filters['keywords'])) {
            $keywords = array_map(
                fn ($kw) => strtolower(trim($kw)),
                $filters['keywords'],
            );
            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $keyword) {
                    $q->orWhereRaw(
                        "to_tsvector('english', title) @@ plainto_tsquery('english', ?)",
                        [$keyword],
                    );
                }
            });
        }

        if (! empty($filters['from_date'])) {
            $query->where('date', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->where('date', '<=', $filters['to_date']);
        }

        $query
            ->orderByDesc('date')
            ->limit(($filters['intent'] ?? null) === 'latest' ? 1 : 10);

        $results = ($filters['intent'] ?? null) === 'latest'
                ? $query->orderByDesc('date')->limit(1)->get()
                : $query->orderByDesc('date')->limit(10)->get();

        Log::info('📊 Query results:', [
            'count' => $results->count(),
            'data'  => $results,
        ]);

        return $results;
    }

    public function parseSumaryResponse(array $tasks)
    {
        return array_map(function ($task) {
            return [
                'title'       => $task['name'],
                'description' => $task['description'],
                'assigned_to' => $task['assignee'] ?? '',
                'status'      => $task['status']   ?? 'Not Started',
                'priority'    => $task['priority'] ?? '',
                'due_date'    => $task['due_date'] ?? '',
            ];
        }, $tasks);
    }

    public function getMostRecentMeetings(
        string $pulseId,
        ?array $select = null,
    ): array {
        $fields = ['title', 'date', 'data_source_id'];
        if ($select) {
            $fields = $select;
        }

        $meetings = Meeting::where('pulse_id', $pulseId)
            ->whereNotNull('data_source_id')
            ->orderBy('date', 'desc')
            ->select($fields)
            ->limit(5)
            ->get()
            ->map(function ($meeting) {
                $formatted         = $meeting->toArray();
                $formatted['date'] = $meeting->date
                    ? Carbon::parse($meeting->date)->format('F j Y')
                    : null;
                return $formatted;
            })
            ->toArray();

        return $meetings;
    }

    public function queryMeetingsWithSimilaritySearch(
        $arguments,
        $orgId,
        $pulseId,
        $topk = 5,
    ) {
        $filters = [
            'data_source_origin' => [
                '$eq' => 'meeting',
            ],
        ];

        if (! empty($arguments['from_date']) && ! empty($arguments['to_date'])) {
            try {
                $from = Carbon::createFromFormat(
                    'Y-m-d',
                    $arguments['from_date'],
                )->startOfDay();
                $to = Carbon::createFromFormat(
                    'Y-m-d',
                    $arguments['to_date'],
                )->startOfDay();

                $fromTimestamp = $from->timestamp;
                $toTimestamp   = $to->timestamp;

                if ($fromTimestamp === $toTimestamp) {
                    $filters['date'] = [
                        '$eq' => $fromTimestamp,
                    ];
                } else {
                    $filters['date'] = [
                        '$gte' => $fromTimestamp,
                        '$lte' => $toTimestamp,
                    ];
                }
            } catch (\Exception $e) {
                Log::error(
                    'from_date and to_date must be valid dates in YYYY-MM-DD format.',
                    [
                        'from_date' => $arguments['from_date'],
                        'to_date'   => $arguments['to_date'],
                    ],
                );
            }
        } elseif (! empty($arguments['from_date'])) {
            try {
                $from = Carbon::createFromFormat(
                    'Y-m-d',
                    $arguments['from_date'],
                )->startOfDay();
                $fromTimestamp = $from->timestamp;

                $filters['date'] = [
                    '$eq' => $fromTimestamp,
                ];
            } catch (\Exception $e) {
                Log::error(
                    'from_date must be a valid date in YYYY-MM-DD format.',
                    [
                        'from_date' => $arguments['from_date'],
                    ],
                );
            }
        } elseif (! empty($arguments['to_date'])) {
            try {
                $to = Carbon::createFromFormat(
                    'Y-m-d',
                    $arguments['to_date'],
                )->startOfDay();
                $toTimestamp = $to->timestamp;

                $filters['date'] = [
                    '$eq' => $toTimestamp,
                ];
            } catch (\Exception $e) {
                Log::error(
                    'to_date must be a valid date in YYYY-MM-DD format.',
                    [
                        'to_date' => $arguments['to_date'],
                    ],
                );
            }
        }

        $userPrompt      = $arguments['user_query'];
        $embedding       = VectorDBService::getEmbedding($userPrompt);
        $vectorDBService = new VectorDBService();
        $matches         = $vectorDBService->query(
            $embedding,
            $orgId,
            $pulseId,
            $topk,
            $filters,
        );

        $finalMatches = [];

        $unique_ids = array_unique(
            array_map(function ($item) {
                return $item['metadata']['data_source_id'] ?? null;
            }, $matches),
        );

        foreach ($unique_ids as $data_source_id) {
            if (! $data_source_id) {
                continue;
            }

            $meeting = Meeting::where(
                'data_source_id',
                $data_source_id,
            )->first();
            if (! $meeting) {
                continue;
            }

            $finalMatches[] = [
                'title'          => $meeting->title,
                'date'           => Carbon::parse($meeting->date)->format('F j Y'),
                'data_source_id' => $meeting->data_source_id,
            ];
        }
        Log::debug('Semantic Query', $finalMatches);

        return $finalMatches;
    }
}
