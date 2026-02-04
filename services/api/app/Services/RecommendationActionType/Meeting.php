<?php

namespace App\Services\RecommendationActionType;

use App\Contracts\RecommendationActionTypeInterface;
use App\Enums\MessageStatus;
use App\Events\AiResponseComplete;
use App\Models\LiveInsightRecommendationAction;
use App\Events\TeamMessageSent;
use App\Helpers\PulseHelper;
use App\Models\DataSource;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\Message;
use App\Models\Summary;
use App\Models\TeamMessage;
use App\Models\Thread;
use App\Services\Agents\Helpers\MarkdownParser;
use App\Services\Agents\Helpers\MeetingHelper;
use App\Services\OpenAIService;
use Exception;
use Illuminate\Support\Facades\Log;

class Meeting implements RecommendationActionTypeInterface
{
    const CREATE_SUMMARY = 'create:summary';
    const UPDATE_SUMMARY = 'update:summary';
    
    public function execute(LiveInsightRecommendationAction $action, LiveInsightOutbox $insight): ?array
    {
        if ($action->method == 'create:summary' || $action->method == 'create_summary') {
            return $this->createSummary($action);
        }

        if ($action->method == 'update:summary' || $action->method == 'update_summary') {
            return $this->updateSummary($action);
        }

        return null;
    }

    protected function createSummary(LiveInsightRecommendationAction $action): array
    {
        try {
            $summary = Summary::create([
                'name'                 => $action->data['name'],
                'pulse_id'             => $action->data['pulse_id'],
                'user_id'              => $action->data['user_id'],
                'data_source_id'       => $action->data['data_source_id'],
                'date'                 => $action->data['date'],
                'attendees'            => $action->data['attendees'],
                'action_items'         => $action->data['action_items'],
                'potential_strategies' => $action->data['potential_strategies'],
                'summary' => $action->data['summary'],
            ]);

            $messageContent = json_encode([
                'summary' => $action->data['metadata']["headline"],
                'content' => [
                    [
                        'summary_id' => $summary->id,
                        'text'       => $summary->name,
                    ],
                ],
            ]);

            $user_id = $summary->user_id;

            $recommendation = LiveInsightRecommendation::findOrFail($action->live_insight_recommendation_id);
            $outbox = $recommendation->outboxForUser($user_id);

            $activeThread = Thread::where('pulse_id', $outbox->pulse_id)
                ->where('organization_id', $outbox->organization_id)
                ->where('is_active', true)
                ->latest()
                ->first();

            if ($activeThread) {
                $message = Message::create([
                    'content'         => $messageContent,
                    'organization_id' => $outbox->organization_id,
                    'role'            => 'assistant',
                    'thread_id'       => $activeThread->id,
                    'user_id'         => $user_id,
                    'tool_calls'      => null,
                    'is_system' => false,
                    'status'    => MessageStatus::COMPLETE->value,
                ]);

                AiResponseComplete::dispatch($message);
            }
    
            return [
                'message' => 'Success, You can now view the summary in your pulse.',
                'id' => $summary->id,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to create summary', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => 'Failed to create summary. Try generating in your pulse instead.',
                'error' => true
            ];
        }
    }

    protected function updateSummary(LiveInsightRecommendationAction $action): array
    {
        try {
            $summary = Summary::findOrFail($action->data["summary_id"]);
            foreach ($action->data['operations'] as $operation) {
                if ($operation['field'] === 'summary') {
                    $operation['updated_value'] = MarkdownParser::clean(
                        $operation['updated_value'],
                    );
                }
                $summary[$operation['field']] = $operation['updated_value'];
            }

            $summary->save();

            $messageContent = json_encode([
                'summary' => "The " . $summary->name . " has been updated. See what’s new below.",
                'content' => [
                    [
                        'summary_id' => $summary->id,
                        'text'       => $summary->name,
                    ],
                ],
            ]);

            $user_id = $summary->user_id;

            $recommendation = LiveInsightRecommendation::findOrFail($action->live_insight_recommendation_id);
            $outbox = $recommendation->outboxForUser($user_id);

            $activeThread = Thread::where('pulse_id', $outbox->pulse_id)
                ->where('organization_id', $outbox->organization_id)
                ->where('is_active', true)
                ->latest()
                ->first();

            if ($activeThread) {
                $message = Message::create([
                    'content'         => $messageContent,
                    'organization_id' => $outbox->organization_id,
                    'role'            => 'assistant',
                    'thread_id'       => $activeThread->id,
                    'user_id'         => $user_id,
                    'tool_calls'      => null,
                    'is_system' => false,
                    'status'    => MessageStatus::COMPLETE->value,
                ]);

                AiResponseComplete::dispatch($message);
            }

            return [
                'message' => 'Success, You can now view the updated summary in your pulse.',
                'id' => $summary->id,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to update summary', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => 'Failed to update summary.',
                'error' => true
            ];
        }
    }

    public static function getClassifications(): array
    {
        return [self::CREATE_SUMMARY, self::UPDATE_SUMMARY, self::UNSUPPORTED_OPERATION];
    }

    public static function classifyOperation(array $recommendation): string
    {
        $recommendationString = json_encode($recommendation);
        $prompt = <<<EOD
        Refer to the recommendation below. Classify the operation if its the following
        create:summary - for creating meeting summary
        update:summary - for updating existing meeting summary
        unsupported_operation - the recommendation neither create, or update meeting dummary - it is meeting related but unsupported
        
        At the moment, the system can only do create and update summary other than that is considered unsupported.
        Example recommendation that is unsupported are the ff: 
        1. Schedule a meeting or event
        2. Add or invite bot to the meeting
        3. Invite someone to a meeting
        4. delete an event

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
                                self::CREATE_SUMMARY,
                                self::UPDATE_SUMMARY,
                                self::UNSUPPORTED_OPERATION,
                            ],
                            'description' => "The classification of the recommendation either create summary or update summary.",
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

    public static function getAllowedTools(string $classification): array
    {
        return match ($classification) {
            self::UPDATE_SUMMARY => ['findMeetings', 'getLatestMeeting', 'getMeetingSummary'],
            default => ['findMeetings', 'getLatestMeeting'],
        };
    }

    public static function getOperationPrompt(string $classification, array $recommendation, LiveInsightOutbox $insight): string
    {
        $dateToday = now('UTC')->format('Y-m-d\TH:i:s\Z');
        $dateRecommendation = $insight->created_at?->copy()->utc()->toIso8601String();
        $createSummaryPrompt = <<<EOD
            Create summary of the meeting mentioned in the recommendation below.
            Use this recommendation details for finding the meeting:
                {$recommendation['title']}
                description: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}

            Pre-requisite.
            It is important to find the meeting first to be summarized. 
            Use "findMeetings" tool or "getLatestMeeting" for getting most recent or latest meeting added in the system. 
            If the recommendation mentioned the meeting title and meeting date use 'findMeetings'.
            Note for searching the meeting, try multiple variation of the title if it cannot be found before failing.
            Examples,
            Original: 'Weekly Engineering Sync'
            Variations: 'Engineering Weekly Sync', 'Engineering Sync'

            Important! Try searching atleast 3 times.
            Always try the original first before trying all variations. Remove the symbols in the variations use alphanumeric only for cleaner search.
            
            If the recommendation is about latest meeting then you can use the 'getLatestMeeting' and pick the latest base on date.
            However check the date now and when the recommendation is created, For reference today is {$dateToday} UTC and this recommendation is created on {$dateRecommendation}. Date accuracy is crucial here. ALways based your date filters based on those dates.
            Example: For recommendation "Create summary for X meeting yesterday" you will use the date when recommendation is created not date today, because its possible that the date time today is different when the recommendation is created. However the current date will be helpfull for generatng timely messages instead like response to user.

            If even after trying multiple times and variations and meeting is still not found, return error response instead.

            Execute this summary creation recommendation without asking for confirmation or follow up questions.
            Return the data_source_id of the meeting only. I will handle the rest of summary creation. If not found return error instead.
            Also dont get confused with 'id' and 'data_source_id' in the tool results, always return the 'data_source_id' not id.
        EOD;

        $updateSummaryPrompt = <<<EOD
            Update the summary of the meeting mentioned in the recommendation below.
            Use this recommendation details for finding the meeting:
                {$recommendation['title']}
                description: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}

            Pre-requisite.
            Before editing a summary, you MUST follow Step 1 and Step 2 in order.

            STEP 1 — FIND MEETING RECORD
            Goal: obtain the meeting’s data_source_id.
            Use the meeting title as search term and the date if provided,
            DO not include the special characters in the title like comma, hypen, dash etc.

            Rules:
            - If the recommendation mentions a meeting title or meeting date → use findMeetings.
            - If the recommendation refers to “latest meeting” → use getLatestMeeting.
            - Perform at least 3 search attempts.
            - First try the exact original title.
            - If not found, try cleaned variations (remove symbols, alphanumeric only, reorder words).
            Example:
                Original: Weekly Engineering Sync
                Variations: Engineering Weekly Sync, Engineering Sync
            - If still not found after all attempts → return an error.

            Date rules:
            - Current date: {$dateToday} UTC
            - Recommendation created on: {$dateRecommendation}
            - Interpret relative dates (“yesterday”, etc.) based on {$dateRecommendation}, not today’s date.

            STEP 2 — RETRIEVE MEETING SUMMARY
            - Call getMeetingSummary using the data_source_id retrieved from Step 1.
            - This returns the complete meeting summary to edit.

            FINAL STEP: Editing:

            Now that you already have the summary, edit the summary. Use the recommendation as guideline on what to edit. 
            The recommendation contains all things needed to edit on the summary.
            Important!, only edit the fields explicitly mentioned in the recommendation. DO not change the values in the summary if not instructed.

            Execute this summary update recommendation without asking for confirmation or follow up questions.
            Return the updated summary of the meeting only. If meeting or original summary not found return error instead.
            Also dont get confused with 'id' and 'data_source_id' in the tool results, always return the 'data_source_id' not id.
        EOD;

        // However check the date now and when the recommendation is created
        // create summary for yesterdays stand up // add the date when the recommendation is ceated to make it accurate

        return match ($classification) {
            self::CREATE_SUMMARY => $createSummaryPrompt,
            self::UPDATE_SUMMARY => $updateSummaryPrompt,
        };
    }

    public static function getOperationSchema(string $classification): array
    {
        return match ($classification) {
            self::CREATE_SUMMARY => [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'create_summary_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            "success" => [
                                "type" => "boolean",
                                "description" => "Always true unless the meeting to summarize cannot be found.",
                            ],
                            "fail_reason" => [
                                "type" => "string",
                                "enum" => ["MEETING_NOT_FOUND", "null"],
                                "description" => "The reason why success is false, only valid reason is Task not found or null if success true"
                            ],
                            "meeting_titles_search_tried" => [
                                "type" => "array",
                                "items" => [
                                    "type" => "string",
                                ],
                                "description" => "List of meeting title variations attempted during search, in the order they were tried."
                            ],
                            'data_source_id' => [
                                'type'        => 'string',
                                'description' => 'The data_source_id value of the meeting returned by search meeting tools. Look for field data_source_id and pass it in here.',
                            ],
                            'meeting_name' => [
                                'type'        => 'string',
                                'description' => 'The meeting name mentioned in the recommendation or if meeting is found use the meeting title there (preffered).'
                            ]
                        ],
                        'required'             => ['success', 'fail_reason', 'data_source_id', 'meeting_titles_search_tried', 'meeting_name'],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
            self::UPDATE_SUMMARY => [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'update_summary_schema',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            "success" => [
                                "type" => "boolean",
                                "description" => "Always true unless the meeting to summarize cannot be found.",
                            ],
                            "fail_reason" => [
                                "type" => "string",
                                "enum" => ["MEETING_NOT_FOUND", "null"],
                                "description" => "The reason why success is false, only valid reason is Task not found or null if success true"
                            ],
                            "meeting_titles_search_tried" => [
                                "type" => "array",
                                "items" => [
                                    "type" => "string",
                                ],
                                "description" => "List of meeting title variations attempted during search, in the order they were tried."
                            ],
                            'data_source_id' => [
                                'type'        => 'string',
                                'description' => 'The data_source_id value of the meeting returned by search meeting tools. Look for field data_source_id and pass it in here.',
                            ],
                            'updated_summary' => [
                                'type'        => 'object',
                                'description' => 'The data_source_id value of the meeting returned by search meeting tools. Look for field data_source_id and pass it in here.',
                                "properties"  => [
                                    'summary_id' => [
                                        'description' => 'The unique identifier of the summary to update. This comes from database retrieve using tool.',
                                        'type'        => 'string',
                                    ],
                                    'operations' => [
                                        'description' => 'A list of operations to perform on the summary. Each item is object with key being the field and the value is the updated value of the field. Only pass the items thats needed to be updated.',
                                        'type'        => 'array',
                                        'items'       => [
                                            'type'       => 'object',
                                            'properties' => [
                                                'field' => [
                                                    'description' => 'The field of the summary to update.',
                                                    'type'        => 'string',
                                                    'enum'        => [
                                                        'summary',
                                                        'name',
                                                        'date',
                                                        'attendees',
                                                        'potential_strategies',
                                                    ],
                                                ],
                                                'updated_value' => [
                                                    'description' => 'The updated value of the field. Always keep the formatting of the original',
                                                    'type'        => 'string',
                                                ],
                                            ],
                                            'required'   => ['field', 'updated_value'],
                                            'additionalProperties' => false,
                                        ],
                                    ],
                                ],
                                'required'             => ['summary_id', 'operations'],
                                'additionalProperties' => false,
                            ],
                        ],
                        'required'             => ['success', 'fail_reason', 'data_source_id', 'meeting_titles_search_tried', "updated_summary"],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ],
        };
    }

    public static function saveRecommendation(string $method, LiveInsightRecommendation $recommendation, LiveInsightOutbox $insight, array $input): void
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

        if ($method === self::CREATE_SUMMARY) {
            $dataSource = DataSource::with('transcript')->find($input['data_source_id']);
            if (!$dataSource || !$dataSource->transcript) {
                $meetingName = $input['meeting_name'] ?? '';
                $message = empty($meetingName)
                    ? "Meeting not found. Try creating the summary in the pulse."
                    : "Meeting '{$meetingName}' not found. Try creating the summary in your pulse instead.";

                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::CREATE_SUMMARY,
                    errorMessage: $message
                );
                return;
            }

            try {
                $meetingHelper = new MeetingHelper($insight->pulse);
                $summaryObj = $meetingHelper->generateSummary($dataSource->transcript->content, $insight->user_id);
                $data = [
                    'name'                 => $summaryObj['metadata']['meeting_name'] . ' Summary',
                    'pulse_id'             => $insight->pulse_id,
                    'user_id'              => $insight->user_id,
                    'data_source_id'       => $input['data_source_id'],
                    'date'                 => $summaryObj['metadata']['meeting_date'],
                    'attendees'            => $summaryObj['metadata']['attendees'],
                    'action_items'         => json_encode($summaryObj['action_items']),
                    'potential_strategies' => json_encode(
                        $summaryObj['potential_strategy'] ?? [],
                    ),
                    'summary' => MarkdownParser::clean($summaryObj['summary']),
                    'metadata' => $summaryObj['metadata'],
                ];
            } catch (Exception $e) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::CREATE_SUMMARY,
                    errorMessage: "Something went wrong. Try creating the summary in your pulse instead."
                );
                return;
            }
        }

        if ($method === self::UPDATE_SUMMARY) {
            if (!$input["success"] || empty("updated_summary")) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::UPDATE_SUMMARY,
                    errorMessage: "Something went wrong. Try editing the summary in your pulse instead."
                );
                return;
            }

            $summary = Summary::find($input["updated_summary"]["summary_id"]);
            if (!$summary) {
                self::saveFailedRecommendation(
                    recommendationId: $recommendation->id,
                    user_id: $insight->user_id,
                    method: self::UPDATE_SUMMARY,
                    errorMessage: "Something went wrong. Try editing the summary in your pulse instead."
                );
                return;
            }
            
            $data = $input["updated_summary"];
        }

        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendation->id,
            'user_id' => $insight->user_id,
            'method' => $method,
            'type' => 'meeting',
            'data' => $data,
        ]);
    }

    private static function saveFailedRecommendation(int $recommendationId, string $user_id, string $method, string $errorMessage, ?array $data = [])
    {
        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendationId,
            'method' => $method,
            'user_id' => $user_id,
            'type' => 'meeting',
            'data' => $data,
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
