<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\SystemThreadInterface;
use App\Contracts\ThreadInterface;
use App\Helpers\CountryHelper;
use App\Models\Message;
use App\Models\Organization;
use App\Models\ReplyTeamThread;
use App\Models\SystemMessage;
use App\Models\SystemThread;
use App\Models\TeamChatSystemMessage;
use App\Models\TeamChatSystemThread;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\Helpers\AgentConfig;
use App\Services\Agents\Helpers\UuidHelper;
use App\Services\Agents\Traits\HasRecommendation;
use App\Services\Agents\Traits\LLMResponseTrait;
use App\Services\MessageProcessingService;
use App\Services\OpenAIService;
use Carbon\Carbon;
use DateTimeZone;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

abstract class BaseSubAgent implements SubAgentInterface
{
    use LLMResponseTrait;
    use HasRecommendation;

    protected $user;
    protected $pulse;
    protected $orgId;
    protected $pulseId;
    protected $openAI;
    public $allowedTools         = null;
    public $interactiveUIEnabled = true;

    private $ThreadClass        = null;
    private $ModelClass         = null;
    private $SystemThreadClass  = null;
    private $SystemMessageClass = null;
    public $deferChanges        = false;

    /**
     * The response schema for the the current running tool
     * set and clear after usage
     * response_format property will enforce the formatting regardless of the result
     */
    public $currentToolResponseFormat = null;
    public $currentToolName           = null;
    public $questionSpecificContext   = null;

    public function __construct($pulse, $questionSpecificContext = null)
    {
        $this->pulse                   = $pulse;
        $this->questionSpecificContext = $questionSpecificContext;
        $this->openAI                  = \OpenAI::client(config('zunou.openai.api_key'));
    }

    /**
     *
     * This contains the shared prompt for all sub agent
     * @return string
     */
    public function getSharedPrompt(): string
    {
        $now           = Carbon::now()->setTimezone($this->user->timezone);
        $formattedDate = $now->format('l F jS Y');
        $formattedTime = $now->format('H:i A');
        $userName      = $this->user ? $this->user->name : 'Guest';

        $country  = new DateTimeZone($this->user->timezone);
        $location = $country->getLocation();

        $country_code = empty($location['country_code'])
            ? 'JP'
            : $location['country_code'];
        $countryName = CountryHelper::getCountryName($country_code);

        $organizationId = $user->last_organization_id ?? $this->user->organizations()->first()->id;
        $organization   = Organization::find($organizationId);
        $orgName        = $organization ? $organization->name : 'Acme Corporation';

        $sharedPrompt = <<<EOD
## General Information

It is $formattedDate. We are in $countryName. It is $formattedTime. Always refer to the current date and time. You belong to an organization called $orgName.
You are talking to a user named $userName in a Pulse. A Pulse refers to this chat assistant. When the user mentions 'pulse', treat it as a reference to the organization: $orgName, vice versa.

## Handling Repeated Queries Rules

Whenever a repeated query is asked, meaning similar question is asked consecutively, you must re-run the relevant tool each time.
But Why? DO this because of the ff reasons:
- Data can change between messages. Data like tasks, meetings, summaries, data sources can be added, updated, or deleted. 
- Re-running the tool will ensure you have the latest data. This prevents stale data across messages. This is critical for ensuring accuracy and trust in real-time systems.
Take note that user can interact either with the UI manually or through the chat. You only know what is happening through the chat. You are not aware of the changes happening in the UI.

### Markdown Correction Rules
You must ensure that all generated Markdown uses only native, valid syntax that renders correctly in standard Markdown parsers such as React Markdown.
Even if the sub agent uses non-native markdown, you must correct it to native markdown.

Rules:
- Do NOT use non-standard bullet characters like `•`, `▪`, `➤`, or similar. These do not render correctly in React-based Markdown components.
- Use `-` or `*` for bullet points only.
- Avoid inline HTML unless explicitly required and known to be supported.
- Follow standard Markdown formatting for headings (`#`), emphasis (`*italic*` / `**bold**`), links, lists, etc.

Example correction:
Incorrect: 
• Item one  
Correct: 
- Item one

If the input or your output includes invalid Markdown characters, rewrite it using proper syntax before returning the final response.
EOD;
        return $sharedPrompt;
    }

    public function getSystemMessages(User $user)
    {
        return collect();
    }

    public function setAllowedTools(array $allowedTools): void
    {
        $this->allowedTools = $allowedTools;
    }

    protected function mergeFunctionCalls(array $additionalCalls): array
    {
        $base_functions = [];
        return array_merge($base_functions, $additionalCalls);
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

    /**
     * This is the response schema for general purposes
     * This is responsible for displaying ui in the assistant response
     */
    public function getResponseSchema(): ?array
    {
        return null;
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

    protected function setModelAndThreadTypes(string $threadId)
    {
        // for pulse chat
        $thread = Thread::find($threadId);
        if ($thread) {
            $this->ModelClass         = Message::class;
            $this->ThreadClass        = Thread::class;
            $this->SystemThreadClass  = SystemThread::class;
            $this->SystemMessageClass = SystemMessage::class;
            return true;
        }

        // for team chat - main thread
        $thread = TeamThread::find($threadId);
        if ($thread) {
            // main team chat threads
            $this->ModelClass  = TeamMessage::class;
            $this->ThreadClass = TeamThread::class;

            $this->SystemThreadClass  = TeamChatSystemThread::class;
            $this->SystemMessageClass = TeamChatSystemMessage::class;
            return true;
        }

        // for team chat - reply thread
        $thread = ReplyTeamThread::find($threadId);
        if ($thread) {
            // main team chat threads
            $this->ModelClass  = TeamMessage::class;
            $this->ThreadClass = ReplyTeamThread::class;

            $this->SystemThreadClass  = TeamChatSystemThread::class;
            $this->SystemMessageClass = TeamChatSystemMessage::class;
            return true;
        }

        throw new Exception('Invalid thread id passed');
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info('[BaseSubAgent] Handling function call', $arguments);

        switch ($functionName) {
            case 'reportUnableToAnswerAndReroute':
                Log::info(
                    '[OrgChart Agent] Received reportUnableToAnswerAndReroute call',
                    $arguments,
                );

                $query  = $arguments['original_query'];
                $reason = $arguments['reason'];

                return <<<TEXT
Did you check the tools available? Make sure you check all the tools and instructions and scope table before deciding.

If the query is really out of scope, Respond exactly this: 

This query ({$query}), cannot be answered by this agent. for this reason: {$reason}
Re-route this query to other agent.

This will be handled by orchestrator agent properly.
TEXT;

            default:
                return 'Not supported';
        }
    }

    public function injectActivityLogs(Collection $formattedMessages): Collection
    {
        return collect($formattedMessages);
    }

    public function processSystemThread(
        string $taskType,
        string $message,
        User $user,
        string $orgId,
        string $pulseId,
        string $parentThreadId,
        ?array $responseSchema = null,
        ?string $parentMessageId = null,
    ): string {
        $this->user    = $user;
        $this->orgId   = $orgId;
        $this->pulseId = $pulseId;

        $this->setModelAndThreadTypes($parentThreadId);

        $systemThread = $this->SystemThreadClass::firstOrCreate([
            'task_type'        => $taskType,
            'organization_id'  => $orgId,
            'user_id'          => $user->id,
            'pulse_id'         => $pulseId,
            'parent_thread_id' => $parentThreadId,
            'status'           => 'pending',
        ]);

        $topic_id = null;
        if ($parentMessageId) {
            $parentMessage = $this->ModelClass::find($parentMessageId);
            $topic_id = $parentMessage->topic_id ?? null;
        }

        $this->SystemMessageClass::create([
            'system_thread_id' => $systemThread->id,
            'role'             => 'user',
            'content'          => $message,
            'topic_id'         => $topic_id,
        ]);

        return $this->processMessageLoop($systemThread, $user, $responseSchema, $topic_id);
    }

    protected function processMessageLoop(
        SystemThreadInterface $systemThread,
        User $user,
        ?array $customResponseSchema = null,
        ?string $topic_id = null,
    ): string {
        $this->user           = $user;
        $continueConversation = true;
        $previousToolCallName = null;

        $allMessages = $this->SystemMessageClass::where('system_thread_id', $systemThread->id)
            ->where('topic_id', $topic_id)
            ->orderBy('id', 'asc')
            ->get();

        $allMessages = $this->injectActivityLogs($allMessages);

        
        while ($continueConversation) {
            $formattedMessages = $this->formatMessages($allMessages);
            $systemPrompt = [
                [
                    'role'    => 'system',
                    'content' => $this->getSystemPrompt(),
                ],
            ];
            $params        = array_merge($systemPrompt, $formattedMessages);
            $functionCalls = $this->getFunctionCalls();

            $req = [
                'model'    => config('zunou.openai.reasoning_model'),
                'messages' => $params,
                'tools'    => $functionCalls,
                'n'        => 1,
            ];

            if ($this instanceof OrgChartAgent) {
                $req['model'] = AgentConfig::model('orgchart');
                Log::debug(
                    'Model switched to ' . AgentConfig::model('orgchart'),
                );
            }

            if ($this instanceof DataSourceAgent) {
                $req['model'] = AgentConfig::model('datasource');
                Log::debug(
                    'Model switched to ' . AgentConfig::model('datasource'),
                );
            }

            if (
                $this->hasToolResponseFormat() && $previousToolCallName === $this->currentToolName
            ) {
                $req['response_format'] = $this->currentToolResponseFormat;
            } else {
                $responseSchema = $this->getResponseSchema();
                if (
                    $responseSchema && $this->interactiveUIEnabled
                ) {
                    $req['response_format'] = $responseSchema;
                }
            }

            // override response schema with custom response schema
            if ($customResponseSchema) {
                $req['response_format'] = $customResponseSchema;
            }

            // Log::debug('[SubAgent] Calling OpenAI with request payload:', $req);

            $response = $this->openAI->chat()->create($req);

            // Log::debug('[SubAgent] OpenAI Response', [
            //     'response' => $response['choices'],
            // ]);

            $message        = $response['choices'][0]['message'] ?? null;
            $messageContent = $message['content']                ?? '';

            $toolCallsArray = isset($message['tool_calls'])
                ? json_encode($message['tool_calls'])
                : null;

            if (
                isset($message['tool_calls']) && is_array($message['tool_calls'])
            ) {
                // retain the state if the response is not tool call for parent agent accessibilty
                $this->clearCurrentToolResponseFormat();

                $assistantMessage = $this->SystemMessageClass::create([
                    'system_thread_id' => $systemThread->id,
                    'role'             => 'assistant',
                    'content'          => $messageContent,
                    'tool_calls'       => $toolCallsArray,
                    'is_system'        => true,
                    'topic_id'         => $topic_id,
                ]);

                $allMessages->push([
                    'role'       => 'assistant',
                    'content'    => $assistant['content'] ?? null,
                    'tool_calls' => $toolCallsArray,
                ]);

                try {
                    $toolMessages = $this->resolveToolCalls(
                        $message['tool_calls'],
                        $systemThread->id,
                        $previousToolCallName,
                        $allMessages,
                        $topic_id,
                    );
                    foreach ($toolMessages as $toolMessage) {
                        // Save tool call responses under one assistant message only
                        $this->SystemMessageClass::create($toolMessage);
                    }
                } catch (\Throwable $exception) {
                    // delete the assistant message to prevent openai errors on succeeding requests
                    $assistantMessage->delete();
                    throw $exception;
                }
            } else {
                $this->SystemMessageClass::create([
                    'system_thread_id' => $systemThread->id,
                    'role'             => 'assistant',
                    'content'          => $messageContent,
                    'tool_calls'       => $toolCallsArray,
                    'is_system'        => true,
                    'topic_id'         => $topic_id,
                ]);

                $continueConversation = false;
            }
        }

        return $messageContent;
    }

    protected function formatMessages($allMessages): array
    {
        return $allMessages
            ->values()
            ->map(function ($message) {
                $role = $message['role'] === 'file' ? 'user' : $message['role'];
                if (
                    $role === 'user' && empty($message['content']) && empty($message['tool_calls'])
                ) {
                    return null;
                }

                $result = [
                    'role'    => $role,
                    'content' => $message['content'] ?? null,
                ];

                if (
                    isset($message['tool_calls']) && is_string($message['tool_calls'])
                ) {
                    $decoded = json_decode($message['tool_calls'], true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $result['tool_calls'] = $decoded;
                    } else {
                        Log::error(
                            "Failed to decode tool_calls for message ID {$message['id']}: " .
                                json_last_error_msg(),
                        );
                    }
                }

                if (isset($message['tool_call_id'])) {
                    $result['tool_call_id'] = $message['tool_call_id'];
                }

                return $result;
            })
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Fully drive an OpenAI conversation, including tool‑calls.
     */
    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        // 1. bootstrap
        $this->user  = $user;
        $pulseId     = $thread->pulse_id;
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
            //Log::info(["messages" => $params]);
            $req = [
                'model'    => config('zunou.openai.reasoning_model'),
                'messages' => $params,
                'tools'    => $functionCalls,
                'n'        => 1,
            ];

            if ($this instanceof OrgChartAgent) {
                $req['model'] = AgentConfig::model('orgchart');
                Log::debug(
                    'Model switched to ' . AgentConfig::model('orgchart'),
                );
            }

            if ($this instanceof DataSourceAgent) {
                $req['model'] = AgentConfig::model('datasource');
                Log::debug(
                    'Model switched to ' . AgentConfig::model('datasource'),
                );
            }

            if (
                $this->hasToolResponseFormat() && $previousToolCallName === $this->currentToolName
            ) {
                $req['response_format'] = $this->currentToolResponseFormat;
            }

            if ($responseSchema) {
                $req['response_format'] = $responseSchema;
            }

            $response = OpenAIService::createCompletion($req);
            $this->clearCurrentToolResponseFormat();

            $assistant = $response['choices'][0]['message'];
            // Log::info(['BaseSubAgent AI response' => $assistant]);
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

                    // append assistant + tool messages
                    $allMessages->push([
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
                    ]);
                    $allMessages->push([
                        'role'         => 'tool',
                        'content'      => $toolResult,
                        'tool_call_id' => $call['id'],
                    ]);
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

    public function resolveToolCalls(
        $toolCalls,
        $systemThreadId,
        &$previousToolCallName,
        &$allMessages,
        ?string $topic_id = null,
    ) {
        $toolMessages = [];

        foreach ($toolCalls as $toolCall) {
            $functionName  = $toolCall['function']['name']      ?? null;
            $argumentsJson = $toolCall['function']['arguments'] ?? '';
            $arguments     = json_decode($argumentsJson, true);

            if (! $functionName || json_last_error() !== JSON_ERROR_NONE) {
                Log::error(
                    'Invalid function call: missing function name or invalid JSON.',
                    [
                        'toolCallId'   => $toolCall['id'] ?? null,
                        'rawArguments' => $argumentsJson,
                    ],
                );

                $content = 'Arguments for this tool call cannot be parsed. Make sure the arguments are valid JSON.';

                $toolCallId = $toolCall['id'] ?? null;
                $toolMessages[] = [
                    'system_thread_id' => $systemThreadId,
                    'role'             => 'tool',
                    'content'          => $content,
                    'tool_call_id'     => $toolCallId,
                    'is_system'        => true,
                    'topic_id'         => $topic_id,
                ];

                $toolMessage = [
                    'role'         => 'tool',
                    'content'      => $content,
                    'tool_call_id' => $toolCallId,
                ];

                $allMessages->push($toolMessage);

                continue;
            }

            Log::debug("Function Call: {$functionName}", $arguments);

            try {
                $responseContent = $this->handleFunctionCall(
                    $functionName,
                    $arguments,
                    $this->orgId,
                    $this->pulseId,
                    $systemThreadId,
                    null,
                );

                $toolMessages[] = [
                    'system_thread_id' => $systemThreadId,
                    'role'             => 'tool',
                    'content'          => $responseContent,
                    'tool_call_id'     => $toolCall['id'] ?? null,
                    'is_system'        => true,
                    'topic_id'         => $topic_id,
                ];

                $toolMessage = [
                    'role'         => 'tool',
                    'content'      => $responseContent,
                    'tool_call_id' => $toolCall['id'] ?? null,
                ];

                $allMessages->push($toolMessage);

                $previousToolCallName = $functionName;
            } catch (\Throwable $exception) {
                Log::error(
                    'Error calling function: ' . $exception->getMessage(),
                    [
                        'functionName' => $functionName,
                        'arguments'    => $arguments,
                        'orgId'        => $this->orgId,
                        'pulseId'      => $this->pulseId,
                        'threadId'     => $systemThreadId,
                        'error'        => $exception->getTraceAsString(),
                    ],
                );

                throw $exception;
            }
        }

        return $toolMessages;
    }
}
