<?php

namespace App\Services\Agents;

use App\Contracts\ThreadInterface;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\Helpers\UuidHelper;
use App\Services\Agents\Traits\LLMResponseTrait;
use App\Services\MessageProcessingService;
use App\Services\OpenAIService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Base class for all agents.
 * This class is only responsible for processing the message loop .
 * It provides a structure for child classes to implement specific functionality.
 * Implement functions in the Admin agent and Member agent classes.
 */
abstract class BaseAgent
{
    use LLMResponseTrait;

    protected $user;
    protected $pulse;

    /**
     * The response schema for the the current running tool
     * set and clear after usage
     * response_format property will enforce the formatting regardless of the result
     */
    public $currentToolResponseFormat = null;
    public $currentToolName           = null;
    public $questionSpecificContext   = null;
    public $responseSchema            = null;
    public $userLastActive            = null;

    public array $directTools = [];

    public function __construct($pulse, $questionSpecificContext = null)
    {
        $this->pulse                   = $pulse;
        $this->questionSpecificContext = $questionSpecificContext;
    }

    // Describe the capabilities of the agent in human friendly terms
    public function getAgentCapabilitiesDescription(
        $misssionContext = null,
    ): string {
        return 'I can assist with tasks related to your work and data. Ask me questions, and I’ll do my best to help.';
    }

    /**
     * Get system messages specific to Admin agents.
     * Override this method in the child class to provide specific system messages.
     * @param User $user
     * @return Collection
     */
    public function getSystemMessages(User $user)
    {
        return null;
    }

    //TODO: remove as this is redundant
    protected function mergeFunctionCalls(array $additionalCalls): array
    {
        $baseFunctions = [];

        return array_merge($baseFunctions, $additionalCalls);
    }

    public function hasToolResponseFormat()
    {
        if ($this->currentToolName && $this->currentToolResponseFormat) {
            return true;
        }
        return false;
    }

    public function setCurrentToolResponseFormat(
        string $currentToolName,
        array $schema,
    ) {
        $this->currentToolName           = $currentToolName;
        $this->currentToolResponseFormat = $schema;
    }

    public function clearCurrentToolResponseFormat()
    {
        $this->currentToolResponseFormat = null;
        $this->currentToolName           = null;
    }

    protected function getUserContext(User $user): Collection
    {
        if (! $user->context) {
            return collect();
        }
        return collect([
            [
                'role'    => 'system',
                'content' => $user->context->context_data,
            ],
        ]);
    }

    public function getPulse()
    {
        return $this->pulse;
    }

    public function getUser()
    {
        return $this->user;
    }

    public static function getUserLastActive(Thread $thread, User $user)
    {
        $messages = Message::where('thread_id', $thread->id)
            ->where('user_id', $user->id)
            ->where('role', 'tool')
            ->orderBy('created_at', 'desc')
            ->get();

        if (!$messages->isEmpty() ) {
            return $messages->first()->created_at;
        }
        
        $previousThread = Thread::where('created_at', '<=', $thread->created_at)
        ->where('user_id', $user->id)
        ->where('id', "!=", $thread->id)
        ->orderBy('created_at', 'desc')
        ->first();
        
        if ($previousThread) {
            return $previousThread->created_at;
        }

        return null;
    }

    /**
     * Fully drive an OpenAI conversation, including tool‑calls.
     */
    public function processMessage(
        Collection $messages,
        Thread $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        // 1. bootstrap
        $this->user  = $user;
        $pulseId     = $thread->pulse_id;
        $temp_ai_message = Message::find($messageId);

        $this->userLastActive = self::getUserLastActive($thread, $user);

        $allMessages = $this->getSystemMessages($user)
            ->merge($this->getUserContext($user))
            ->merge($messages);
        $functionCalls        = $this->getFunctionCalls();
        $previousToolCallName = null;
        $continueConversation = true;
        $finalContent         = '';

        // 2. main loop
        while ($continueConversation) {
            $params = (new MessageProcessingService())->formatMessages(
                $allMessages,
            );
            Log::info(['messages' => $params]);
            Log::info(['functionCalls' => json_encode($functionCalls)]);
            $req = [
                'model'    => config('zunou.openai.reasoning_model'),
                'messages' => $params,
                'tools'    => $functionCalls,
                'n'        => 1,
            ];

            if (
                $this->hasToolResponseFormat() && $previousToolCallName === $this->currentToolName
            ) {
                $req['response_format'] = $this->currentToolResponseFormat;
            } elseif ($this->responseSchema) {
                $newDescription = "The exact output returned by the sub-agent. Do not modify. This is already verified and adheres to pulse formattting rules. DO not alter the message output of the sub agent including the formatting. This is shown directly to the user and should summarize the outcome, prompt for a decision, or provide necessary context for the UI element that follows.";
                $this->responseSchema['json_schema']["schema"]["properties"]["message"]["description"] = $newDescription;
                $req['response_format'] = $this->responseSchema;
            }

            if ($responseSchema) {
                // Override the response schema if provided
                $req['response_format'] = $responseSchema;
            }
         
            $response = OpenAIService::createCompletion($req);
            $this->clearCurrentToolResponseFormat();

            $assistant = $response['choices'][0]['message'];
            Log::info(['BASEAGENT AI response' => $assistant]);
            if (isset($assistant['tool_calls'])) {
                // iterate over tool calls
                foreach ($assistant['tool_calls'] as $call) {
                    $fn   = $call['function']['name'] ?? null;
                    $args = json_decode(
                        $call['function']['arguments'] ?? '',
                        true,
                    );
                    if (! $fn || json_last_error() !== JSON_ERROR_NONE) {
                        Log::error('Bad tool call: ' . json_last_error_msg());
                        continue;
                    }

                    $toolResult = $this->handleFunctionCall(
                        $fn,
                        $args,
                        $thread->organization_id,
                        $pulseId,
                        $thread->id,
                        $messageId,
                    );
                    $previousToolCallName = $fn;

                    $assistantMessage = [
                        'role'       => 'assistant',
                        'content'    => $assistant['content'] ?? null,
                        'tool_calls' => [
                            [
                                'id'       => $call['id'],
                                'type'     => 'function',
                                'function' => [
                                    'name'      => $fn,
                                    'arguments' => $call['function']['arguments'],
                                ],
                            ],
                        ],
                    ];
                    $toolMessage = [
                        'role'         => 'tool',
                        'content'      => $toolResult,
                        'tool_call_id' => $call['id'],
                    ];

                    $allMessages->push($assistantMessage);
                    $allMessages->push($toolMessage);

                    // ✅ Save to DB
                    $this->storeMessage($thread, $user, $assistant, $call, $temp_ai_message->topic_id);
                    $this->storeToolResponse(
                        $thread,
                        $user,
                        $toolResult,
                        $call['id'],
                        $temp_ai_message->topic_id,
                    );

                    $isFinal = $args['is_final'] ?? false;
                    $stepNumber = $args['step_number'] ?? 1;
                    if ($isFinal && $stepNumber === 1) {
                        Log::info('final: returning tool result immediately');
                        $continueConversation = false;
                        $finalContent         = $toolResult;
                    }
                }
            } else {
                // done
                $continueConversation = false;
                $finalContent         = $assistant['content'] ?? '';
            }
        }

        return $finalContent;
    }

    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([]);
    }

    /**
     * Get list of direct tools that should terminate the conversation loop
     * These are tools that bypass nested agent communication and return results directly
     * 
     * @return array<string> Array of tool function names
     */
    protected function getDirectTools(): array
    {
        return [];
    }

    public function cleanUuidFields(array $arguments, ?array $uuidFields = [])
    {
        $defaultUuidFields = [
            'data_source_id',
            'summary_id',
            'meeting_data_source_id',
        ];

        $uuidFields = array_merge($defaultUuidFields, $uuidFields);

        foreach ($arguments as $key => $value) {
            if (in_array($key, $uuidFields)) {
                if (empty($value)) {
                    continue;
                }

                $arguments[$key] = UuidHelper::clean($value);
            }
        }

        return $arguments;
    }

    /**
     * Handle function calls specific to Admin agents.
     * This method should be overridden in child classes to implement specific functionality.
     * Admin (manager) agents and member agents should have different implementations.
     *
     * @param string $functionName
     * @param array $arguments
     * @param mixed $orgId
     * @param mixed $pulseId
     * @param mixed $threadId
     * @param mixed $messageId
     * @return string
     *
     */
    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ) {
        return 'Function call not implemented in BaseAgent';
    }

    private function storeMessage(
        Thread $thread,
        User $user,
        array $assistant,
        array $call,
        ?string $topic_id = null,
    ): void {
        Message::create([
            'content'         => $assistant['content'] ?? null,
            'organization_id' => $thread->organization_id,
            'role'            => 'assistant',
            'thread_id'       => $thread->id,
            'topic_id'        => $topic_id,
            'user_id'         => $user->id,
            'tool_calls'      => json_encode([
                [
                    'id'       => $call['id'],
                    'type'     => 'function',
                    'function' => [
                        'name'      => $call['function']['name'],
                        'arguments' => $call['function']['arguments'],
                    ],
                ],
            ]),
            'is_system' => empty($assistant['content']),
            'status'    => ! empty($assistant['content']) ? 'COMPLETE' : 'pending',
        ]);
    }

    private function storeToolResponse(
        Thread $thread,
        User $user,
        string $toolResult,
        string $toolCallId,
        ?string $topic_id = null,
    ): void {
        Message::create([
            'content'         => $toolResult,
            'organization_id' => $thread->organization_id,
            'role'            => 'tool',
            'thread_id'       => $thread->id,
            'topic_id'        => $topic_id,
            'user_id'         => $user->id,
            'tool_call_id'    => $toolCallId,
            'is_system'       => true,
        ]);
    }

    // Duplicated the main process message loop to avoid conflicts
    public function processMessageInMemory(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        bool $enableToolCalls = true,
        bool $enableInteractiveUI = true,
    ): string {
        $this->user  = $user;
        $pulseId     = $thread->pulse_id;

        $allMessages = $this->getSystemMessages($user)
            ->merge($this->getUserContext($user))
            ->merge($messages);

        $functionCalls        = $this->getFunctionCalls();
        $previousToolCallName = null;
        $continueConversation = true;
        $finalContent         = '';

        while ($continueConversation) {
            $params = (new MessageProcessingService())->formatMessages(
                $allMessages,
            );
         
            $req = [
                'model'    => config('zunou.openai.reasoning_model'),
                'messages' => $params,
                'tools'    => $enableToolCalls ? $functionCalls : [],
                'n'        => 1,
            ];

            if (
                $this->hasToolResponseFormat() && $previousToolCallName === $this->currentToolName
            ) {
                $req['response_format'] = $this->currentToolResponseFormat;
            } elseif ($this->responseSchema && $enableInteractiveUI) {
                $newDescription = "The exact output returned by the sub-agent. Do not modify. This is already verified and adheres to pulse formattting rules. DO not alter the message output of the sub agent including the formatting. This is shown directly to the user and should summarize the outcome, prompt for a decision, or provide necessary context for the UI element that follows.";
                $this->responseSchema['json_schema']["schema"]["properties"]["message"]["description"] = $newDescription;
                $req['response_format'] = $this->responseSchema;
            }
         
            $response = OpenAIService::createCompletion($req);
            $this->clearCurrentToolResponseFormat();

            $assistant = $response['choices'][0]['message'];
            if (isset($assistant['tool_calls'])) {
                // iterate over tool calls
                foreach ($assistant['tool_calls'] as $call) {
                    $fn   = $call['function']['name'] ?? null;
                    $args = json_decode(
                        $call['function']['arguments'] ?? '',
                        true,
                    );
                    if (! $fn || json_last_error() !== JSON_ERROR_NONE) {
                        Log::error('Bad tool call: ' . json_last_error_msg());
                        continue;
                    }

                    $toolResult = $this->handleFunctionCall(
                        $fn,
                        $args,
                        $thread->organization_id,
                        $pulseId,
                        $thread->id,
                        $messageId,
                    );
                    $previousToolCallName = $fn;

                    $assistantMessage = [
                        'role'       => 'assistant',
                        'content'    => $assistant['content'] ?? null,
                        'tool_calls' => [
                            [
                                'id'       => $call['id'],
                                'type'     => 'function',
                                'function' => [
                                    'name'      => $fn,
                                    'arguments' => $call['function']['arguments'],
                                ],
                            ],
                        ],
                    ];
                    $toolMessage = [
                        'role'         => 'tool',
                        'content'      => $toolResult,
                        'tool_call_id' => $call['id'],
                    ];

                    $allMessages->push($assistantMessage);
                    $allMessages->push($toolMessage);
                }
            } else {
                // done
                $continueConversation = false;
                $finalContent         = $assistant['content'] ?? '';
            }
        }

        return $finalContent;
    }
}
