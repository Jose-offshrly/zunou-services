<?php

namespace App\Services;

use App\Models\DataSource;
use App\Models\ReplyTeamThread;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\BaseAgent;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class TeamChatMessageProcessingService
{
    protected $openAI;
    protected static $instance;

    public function __construct()
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));
    }

    public static function getInstance(): self
    {
        if (! isset(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function processMessages(
        Collection $messages,
        ReplyTeamThread|TeamThread $thread,
        BaseAgent $agent,
        User $user,
        TeamMessage $teamMessage,
    ): string {
        $pulse = $teamMessage->teamThread->pulse;
        Log::info('pulse', ['pulse' => $pulse->id]);
        $defaultMessages = $agent->getSystemMessages($user, [
            'message' => $teamMessage,
        ]);
        $userContext          = $defaultMessages->merge($this->getUserContext($user));
        $allMessages          = $userContext->merge($messages);
        $functionCalls        = $agent->getFunctionCalls();
        $previousToolCallName = null;
        $topicId = $teamMessage->topic_id ?? null;

        $continueConversation = true;
        $responseContent      = '';
        $lastToolResponse     = null;

        while ($continueConversation) {
            $params = $this->formatMessages($allMessages, $user->timezone);

            // Uncomment for debugging:
            Log::info(
                '[TeamChatMessageProcessingService] Params: ' . json_encode($params),
            );
            // Log::info(
            //     '[TeamChatMessageProcessingService] FunctionCalls: ' .
            //         json_encode($functionCalls),
            // );

            $openAIRequestBody = [
                'model'    => config('zunou.openai.model'),
                'messages' => $params,
                'tools'    => $functionCalls,
                'n'        => 1,
            ];

            if (
                $agent->hasToolResponseFormat() && $previousToolCallName === $agent->currentToolName
            ) {
                $openAIRequestBody['response_format'] = $agent->currentToolResponseFormat;
            }

            $response = $this->openAI->chat()->create($openAIRequestBody);

            // Do not remove this, make sure to remove the response format after usage
            $agent->clearCurrentToolResponseFormat();

            $message = $response['choices'][0]['message'];

            // Uncomment for debugging:
            Log::info(
                '[TeamChatMessageProcessingService] Response: ' .
                    json_encode($message),
            );

            if ($this->hasToolCalls($message)) {
                foreach ($message['tool_calls'] as $toolCall) {
                    $functionName = $toolCall['function']['name'] ?? null;
                    $arguments    = $this->decodeArguments(
                        $toolCall['function']['arguments'] ?? '',
                    );

                    if (! $functionName || $arguments === null) {
                        Log::error(
                            '[TeamChatMessageProcessingService] Invalid tool call: ' .
                                json_last_error_msg(),
                        );
                        continue;
                    }

                    $responseContent = $this->handleToolCall(
                        $agent,
                        $functionName,
                        $arguments,
                        $thread,
                        $pulse->id,
                        $toolCall,
                        $teamMessage->id,
                    );

                    // Store last tool response if it's structured JSON with valid ui property
                    if ($responseContent && json_decode($responseContent) !== null) {
                        $decoded = json_decode($responseContent, true);
                        if (isset($decoded['ui']) && $decoded['ui'] !== null && $decoded['ui'] !== []) {
                            $lastToolResponse = $responseContent;
                        }
                    }

                    $previousToolCallName = $functionName;

                    $allMessages = $this->updateMessagesWithToolCall(
                        $allMessages,
                        $message,
                        $toolCall,
                        $responseContent,
                        $teamMessage,
                        $user,
                        $topicId,
                    );
                }
            } else {
                $continueConversation = false;
            }
        }

        // If we have a structured JSON response from a tool call, use that instead
        if ($lastToolResponse) {
            return $lastToolResponse;
        }
        
        return $message['content'] ?? '';
    }

    private function getUserContext(User $user): Collection
    {
        if (! $user->context) {
            return collect();
        }
        Log::info(
            '[TeamChatMessageProcessingService] Context: ' .
                json_encode($user->context),
        );
        return collect([
            [
                'role'    => 'system',
                'content' => $user->context->context_data,
            ],
        ]);
    }

    private function getFileContext(Thread $thread): Collection
    {
        $data_source_list_text = DataSource::where(
            'pulse_id',
            $thread->pulse_id,
        )
            ->get()
            ->map(function ($source) {
                return $source->name . ' : ' . ($source->summary ?? ' ');
            })
            ->implode(', ');

        return collect([
            [
                'role'    => 'system',
                'content' => 'These are the file sources available to you to aid the user (using the lookupInformation function):' .
                    $data_source_list_text,
            ],
        ]);
    }

    private function hasToolCalls(array $message): bool
    {
        return isset($message['tool_calls']) && is_array($message['tool_calls']);
    }

    private function decodeArguments(?string $arguments): ?array
    {
        $decoded = json_decode($arguments, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    private function handleToolCall(
        BaseAgent $agent,
        string $functionName,
        array $arguments,
        ReplyTeamThread|TeamThread $thread,
        string $pulseId,
        array $toolCall,
        string $messageId,
    ): string {
        if ($thread instanceof ReplyTeamThread) {
            $orgId = $thread->teamThread->organization_id;
        } else {
            $orgId = $thread->organization->id;
        }
        return $agent->handleFunctionCall(
            $functionName,
            $arguments,
            $orgId,
            $pulseId,
            $thread->id,
            $messageId,
        );
    }

    private function updateMessagesWithToolCall(
        Collection $allMessages,
        array $message,
        array $toolCall,
        string $responseContent,
        TeamMessage $teamMessage,
        User $user,
        ?string $topicId = null,
    ): Collection {
        $encodedArguments = json_encode(
            $toolCall['function']['arguments'] ?? '',
        );

        $assistantMessage = [
            'role'       => 'assistant',
            'content'    => $message['content'] ?? null,
            'tool_calls' => [
                [
                    'id'       => $toolCall['id'],
                    'type'     => 'function',
                    'function' => [
                        'name'      => $toolCall['function']['name'],
                        'arguments' => $encodedArguments,
                    ],
                ],
            ],
        ];
        $allMessages->push($assistantMessage);
        $this->storeMessage(
            $message,
            $teamMessage,
            $user,
            $toolCall,
            $encodedArguments,
            $topicId,
        );

        $toolMessage = [
            'role'         => 'tool',
            'content'      => $responseContent,
            'tool_call_id' => $toolCall['id'],
        ];
        $allMessages->push($toolMessage);

        $this->storeToolResponse(
            $responseContent,
            $teamMessage,
            $user,
            $toolCall['id'],
        );

        return $allMessages;
    }

    private function storeMessage(
        array $message,
        TeamMessage $teamMessage,
        User $user,
        array $toolCall,
        string $encodedArguments,
        ?string $topicId = null,
    ): void {
        $messageData = [
            'team_thread_id'       => $teamMessage->team_thread_id,
            'reply_team_thread_id' => $teamMessage->reply_team_thread_id,
            'content'              => $message['content'] ?? null,
            'role'                 => 'assistant',
            'user_id'              => $user->id,
            'tool_calls'           => json_encode([
                [
                    'id'       => $toolCall['id'],
                    'type'     => 'function',
                    'function' => [
                        'name'      => $toolCall['function']['name'],
                        'arguments' => $encodedArguments,
                    ],
                ],
            ]),
            'is_system' => empty($message['content']),
            'topic_id' => $topicId,
        ];

        TeamMessage::create($messageData);
    }

    private function storeToolResponse(
        string $responseContent,
        TeamMessage $teamMessage,
        User $user,
        string $toolCallId,
    ): void {
        TeamMessage::create([
            'team_thread_id'       => $teamMessage->team_thread_id,
            'reply_team_thread_id' => $teamMessage->reply_team_thread_id,
            'content'              => $responseContent,
            'role'                 => 'tool',
            'user_id'              => $user->id,
            'tool_call_id'         => $toolCallId,
            'is_system'            => true,
        ]);
    }

    public function formatMessages($allMessages, $timezone): array
    {
        $allMessages = $allMessages->values();

        // switched to flatmap to be able to add new item to the array conditionally
        return $allMessages
            ->flatMap(function ($message) use ($timezone) {
                $role = $message['role'] === 'file' ? 'user' : $message['role'];
                if (
                    $role === 'user' && empty($message['content']) && empty($message['tool_calls'])
                ) {
                    return [];
                }
                
                $content = $message['content'] ?? null;
                
                
                if ($role === 'user') {
                    $timestamp = Carbon::parse($message['created_at'])->setTimezone($timezone)->format('Y-m-d H:i:s T');
                    
                    $name    = $message['user']['name'];
                    $content = "[$timestamp] [$name] $content";
                }

                $result = [
                    'role'    => $role,
                    'content' => $content,
                ];

                if (isset($message['tool_calls'])) {
                    $result['tool_calls'] = is_array($message['tool_calls'])
                        ? $message['tool_calls']
                        : json_decode($message['tool_calls'], true);
                }

                if (isset($message['tool_call_id'])) {
                    $result['tool_call_id'] = $message['tool_call_id'];
                }

                if (isset($message['is_parent_reply']) && $message['is_parent_reply']) {
                    $metadata = $message['metadata'] ?? [];

                    if (!empty($metadata['excerpt'])) {
                        $excerpt = [
                            'role'    => 'system',
                            'content' => $metadata['excerpt'],
                        ];

                        return [$result, $excerpt];
                    }

                }

                return [$result];
            })
            ->values()
            ->toArray();
    }

    public function formatMessagesWithSubThread(
        Collection $allMessages, 
        string $timezone,
    ): array {
        $allMessages = $allMessages->values();
        $compiledMessages = collect();

        foreach ($allMessages as $message) {
            $content = $message->content ?? null;
            $role = $message->role === 'file' ? 'user' : $message->role;
                
            if ($role === 'user') {
                $timestamp = Carbon::parse($message->created_at)->setTimezone($timezone)->format('Y-m-d H:i:s T');
                
                $name    = $message->user->name;
                $content = "[$timestamp] [$name] $content";
            }

            $result = [
                'role'    => $role,
                'content' => $content,
            ];
            
            if (empty($message->reply_team_thread_id)) {
                $compiledMessages->push($result);
                continue;
            }

            $threadId = $message->replyTeamThread->id;

            foreach ($message->replyTeamThread->teamMessages as $subMessage) {
                if ($subMessage->is_system) {
                    continue;
                }
                $role = $subMessage->role === 'file' ? 'user' : $subMessage->role;
                $content = $subMessage->content ?? null;

                $timestamp = Carbon::parse($subMessage->created_at)->setTimezone($timezone)->format('Y-m-d H:i:s T');
                $name = "pulse";
                if ($role === 'user') {
                    $name    = $subMessage->user->name;
                }
                $content = "[$timestamp] [$name] $content";
    
                $result = [
                    'role'    => $role,
                    'content' => $content,
                ];

                $compiledMessages->push($result);
            }
        }

        return $compiledMessages->toArray();
    }

}
