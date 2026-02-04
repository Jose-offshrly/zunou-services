<?php

namespace App\Services\RecommendationActionType;

use App\Contracts\RecommendationActionTypeInterface;
use App\Models\LiveInsightRecommendationAction;
use App\Events\TeamMessageSent;
use App\Models\LiveInsightOutbox;
use App\Models\LiveInsightRecommendation;
use App\Models\TeamMessage;
use Illuminate\Support\Facades\Log;
use App\Services\OpenAIService;

class TeamChat implements RecommendationActionTypeInterface
{
    const CREATE_MESSAGE = 'create';

    public function execute(LiveInsightRecommendationAction $action, LiveInsightOutbox $insight): ?array
    {
        if ($action->method == 'create') {
            return $this->create($action);
        }

        return null;
    }

    protected function create(LiveInsightRecommendationAction $action): array
    {
        try {
            $data = $action->data;
            $data['user_id'] = $data['user_id'] ?? $action->user_id;
            
            $teamMessage = TeamMessage::create($data);
            Log::info('Team message created', [
                'team_message' => $teamMessage,
            ]);

            TeamMessageSent::dispatch($teamMessage);
    
            return [
                'message' => 'Team message posted successfully',
                'id' => $teamMessage->id,
            ];
        } catch (\Throwable $th) {
            Log::error('Failed to create team message', [
                'error' => $th->getMessage(),
            ]);

            return [
                'message' => "Failed to post team message",
                'error' => true
            ];
        }
    }

    public static function getClassifications(): array
    {
        return [self::CREATE_MESSAGE, self::UNSUPPORTED_OPERATION];
    }

    public static function classifyOperation(array $recommendation): string
    {
        $recommendationString = json_encode($recommendation);
        $prompt = <<<EOD
        Refer to the recommendation below. Classify the operation if its the following
        create - for creating/posting new team message
        unsupported_operation - the recommendation is not about creating a team message

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
                                self::CREATE_MESSAGE,
                                self::UNSUPPORTED_OPERATION,
                            ],
                            'description' => "The classification of the recommendation either create or unsupported",
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

        $decoded = json_decode($content, true);
        return $decoded["classification"];
    }

    public static function getAllowedTools(string $classification): array
    {
        return match ($classification) {
            self::CREATE_MESSAGE => ['findTaskByName', 'findNoteByName', 'findMultipleTasksByName'],
            default => [],
        };
    }

    public static function getOperationPrompt(string $classification, array $recommendation, LiveInsightOutbox $insight): string
    {
        $createPrompt = <<<EOD
            Create team message for this recommendation:
                {$recommendation['title']}
                message: {$recommendation['description']}
            
            {$recommendation['next_agent_prompt']}
            
            If tasks are mentioned, use findTaskByName or findMultipleTasksByName to get task IDs.
            If notes are mentioned, use findNoteByName to get note IDs.
            
            Execute this recommendation without asking for confirmation.
            Return the message data in json format.
        EOD;

        return match ($classification) {
            self::CREATE_MESSAGE => $createPrompt,
            default => '',
        };
    }

    public static function getOperationSchema(string $classification): array
    {
        $createSchema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'create_team_message_schema',
                'schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message content to post. This should be written in POV of the current user as if they say this in team chat themselves. Do not overdo it make it natural, concise and not robotic.',
                        ],
                        'task_ids' => [
                            'type'        => 'array',
                            'description' => 'Optional array of Task IDs to generate clickable task references in UI. Always fill this when tasks are mentioned',
                            'items'       => [
                                'type' => 'string',
                            ],
                        ],
                        'note_ids' => [
                            'type'        => 'array',
                            'description' => 'Optional array of Note IDs to generate clickable note references in UI. Always fill this when notes are mentioned',
                            'items'       => [
                                'type' => 'string',
                            ],
                        ],
                    ],
                    'required'             => ['message', 'task_ids', 'note_ids'],
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        return match ($classification) {
            self::CREATE_MESSAGE => $createSchema,
            default => [],
        };
    }

    public static function saveRecommendation(string $method, LiveInsightRecommendation $recommendation, LiveInsightOutbox $insight, array $data): void
    {
        Log::info('[TeamChat] saveRecommendation called', [
            'method' => $method,
            'recommendation_id' => $recommendation->id,
            'data' => $data,
        ]);

        if (isset($input["error"]) && $input["error"] === true) {
            self::saveFailedRecommendation(
                recommendationId: $recommendation->id,
                user_id: $insight->user_id,
                method: $method,
                errorMessage: "Sorry, something went wrong while carrying out your recommendation.."
            );
            return;
        }

        $taskIds = $data['task_ids'] ?? [];
        $noteIds = $data['note_ids'] ?? [];
        
        $references = [];
        
        foreach ($taskIds as $taskId) {
            $references[] = [
                'type' => 'task',
                'id' => $taskId,
            ];
        }
        
        foreach ($noteIds as $noteId) {
            $references[] = [
                'type' => 'note',
                'id' => $noteId,
            ];
        }
        
        $content = $data['message'];
        if (!empty($references)) {
            $content = json_encode([
                'message' => $data['message'],
                'ui' => [
                    'type' => 'references',
                    'references' => $references,
                ],
            ]);
        }
        
        $pulseId = $data['pulse_id'] ?? $insight->pulse_id;

        $teamThread = \App\Models\TeamThread::where('pulse_id', $pulseId)->first();
        
        if (!$teamThread) {
            Log::error('[TeamChat] No team thread found', [
                'recommendation_id' => $recommendation->id,
                'pulse_id' => $pulseId,
            ]);
            return;
        }
        
        $actionData = match ($method) {
            self::CREATE_MESSAGE => [
                'team_thread_id' => $teamThread->id,
                'content' => $content,
                'user_id' => $insight->user_id,
                'is_from_pulse_chat' => true,
            ],
            default => [],
        };

        Log::info('[TeamChat] Creating recommendation action', [
            'actionData' => $actionData,
        ]);

        if (!empty($actionData)) {
            $action = LiveInsightRecommendationAction::create([
                'live_insight_recommendation_id' => $recommendation->id,
                'method' => $method,
                'type' => 'team_chat',
                'data' => $actionData,
                'user_id' => $insight->user_id,
            ]);
            
            Log::info('[TeamChat] Recommendation action created', [
                'action_id' => $action->id,
            ]);
        }
    }

    private static function saveFailedRecommendation(int $recommendationId, string $user_id, string $method, string $errorMessage, ?array $data = [])
    {
        LiveInsightRecommendationAction::create([
            'live_insight_recommendation_id' => $recommendationId,
            'method' => $method,
            'user_id' => $user_id,
            'type' => 'note',
            'data' => $data,
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
