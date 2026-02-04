<?php

namespace App\Services\Routing;

use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\OpenAIService;
use App\Services\Pipelines\Meeting\MeetingSummaryPipeline;
use App\Services\Routing\Enums\OperationType;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class RequestRouter
{
    protected array $pipelineMap = [
        OperationType::CREATE_SUMMARY->value => MeetingSummaryPipeline::class,
    ];

    public function route(
        Collection $messages,
        Thread $thread,
        User $user,
        Message $message,
    ): ?string {
        $operation = $this->identifyOperation($messages, $message);

        if ($operation === null) {
            return null;
        }

        $pipelineClass = $this->pipelineMap[$operation->value] ?? null;

        if (!$pipelineClass) {
            Log::warning('[RequestRouter] No pipeline mapped for operation', [
                'operation' => $operation->value,
            ]);
            return null;
        }

        try {
            /** @var \App\Services\Routing\Contracts\PipelineInterface $pipeline */
            $pipeline = app($pipelineClass);

            $pipelineStart = microtime(true);
            $result = $pipeline->execute($messages, $thread, $user, $message);
            $pipelineTime = microtime(true) - $pipelineStart;

            Log::info('[PERF] RequestRouter: Pipeline executed', [
                'operation' => $operation->value,
                'pipeline' => class_basename($pipelineClass),
                'pipeline_time' => round($pipelineTime, 3),
            ]);

            return $result;
        } catch (\Throwable $e) {
            Log::error('[RequestRouter] Pipeline execution failed', [
                'operation' => $operation->value,
                'pipeline' => $pipelineClass,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    public function identifyOperation(
        Collection $messages,
        Message $message,
    ): ?OperationType {
        $routingStart = microtime(true);

        $recentMessages = $messages
            ->reverse()
            ->take(4)
            ->reverse()
            ->values();

        $contextMessages = $recentMessages->map(function ($msg) {
            return [
                'role' => $msg['role'] ?? 'user',
                'content' => $msg['content'] ?? '',
            ];
        })->toArray();

        $currentMessageContent = $message->content ?? '';
        $contextMessages[] = [
            'role' => 'user',
            'content' => $currentMessageContent,
        ];

        $prompt = <<<PROMPT
You are a request classifier. Analyze the user's current message and the recent conversation context to identify what operation they want to perform.

Available operations:
- "create_summary": User wants to create/generate a summary of a meeting

Return ONLY the operation type as a JSON object with this exact structure:
{
    "operation": "create_summary" or null
}

If the request doesn't match any known operation, return {"operation": null}.

Examples:
- "create a summary for the latest meeting" → {"operation": "create_summary"}
- "summarize the Zunou standup" → {"operation": "create_summary"}
- "generate summary" → {"operation": "create_summary"}
- "what happened in the meeting?" → {"operation": null}
- "show me tasks" → {"operation": null}

Recent conversation context:
PROMPT;

        foreach ($contextMessages as $msg) {
            $prompt .= "\n{$msg['role']}: {$msg['content']}";
        }

        $prompt .= "\n\nCurrent user message: {$currentMessageContent}";

        try {
            $response = OpenAIService::createCompletion([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a request classifier. Always return valid JSON only.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'response_format' => [
                    'type' => 'json_object',
                ],
                'temperature' => 0.1,
            ]);

            $result = json_decode($response['choices'][0]['message']['content'], true);
            $operationValue = $result['operation'] ?? null;

            $routingTime = microtime(true) - $routingStart;

            if ($operationValue === null) {
                Log::info('[PERF] RequestRouter: No operation identified', [
                    'routing_time' => round($routingTime, 3),
                ]);
                return null;
            }

            $operation = OperationType::tryFrom($operationValue);
            Log::info('[PERF] RequestRouter: Operation identified', [
                'operation' => $operation?->value,
                'routing_time' => round($routingTime, 3),
            ]);

            return $operation;
        } catch (\Throwable $e) {
            Log::error('[RequestRouter] Failed to identify operation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }
}

