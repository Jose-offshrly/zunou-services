<?php

namespace App\Services\Agents\SubAgents;

use App\Contracts\ThreadInterface;
use App\Jobs\AddDataToVectorDB;
use App\Jobs\UpdateVectorByPineconeIdJob;
use App\Models\SystemMessage;
use App\Models\SystemThread;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\Helpers\GettingStartedHelper;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class GettingStartedAgent extends BaseSubAgent
{
    protected $openAI;
    protected $gettingStartedHelper;
    protected $orgId;
    protected $pulseId;

    public function __construct($pulse, $questionSpecificContext = null)
    {
        parent::__construct($pulse, $questionSpecificContext);

        $this->gettingStartedHelper = new GettingStartedHelper();
        $this->openAI               = \OpenAI::client(config('zunou.openai.api_key'));
    }

    /**
     * Define the main system prompt to explain the purpose and rules of this agent.
     *
     * @return string
     */
    public function getSystemPrompt(): string
    {
        return <<<EOD
    You are the Getting Started Agent. Your purpose is to assist users with onboarding to our system by asking them "Getting Started" questions.  The first thing to do is to use the getNextGettingStartedQuestion function to retrieve the next onboarding question.  Then check the current value in the database using the lookupInformation function and ask the user if this is correct or if they want to change it. If they want to change it you can update the data using the editData function.
    When you communicate with the user try to be as concise as possible, dont share IDs or any other sensitive information but do let them know what is going on.  If you can't help them then let them know what is the issue.  If there is no existing data in the database then you can add the data with the addData function.  
    Always update the getting started question status after you received a response from the user, if they want to change the value or they want to keep it then set the question to complete so we know it has been answered.  If they want to skip the question then you can set the question to skipped.

    Remember you are responsible for:
    - Ensuring accuracy of data.
    - Using system functions to update and retrieve data as needed.
    - Never inventing information.
    Good luck!
EOD;
    }

    /**
     * Define function calls specific to the GettingStartedAgent.
     * These functions will handle onboarding-related tasks such as retrieving questions and updating answers.
     *
     * @return array
     */
    public function getFunctionCalls(): array
    {
        return $this->mergeFunctionCalls([
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'getNextGettingStartedQuestion',
                    'description' => 'Retrieve the next unanswered "Getting Started" question for onboarding.',
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'editData',
                    'description' => 'Make edits or updates to existing data, providing a pinecone_id and question_id to help us identify the original records.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'data' => [
                                'type'        => 'string',
                                'description' => 'The data provided by the user, combine the onboarding question and the response to make this understandable by itself, so we know what it is. For example: "The company vision is: To provide safety for all". If updating, you do not need to state it is an update or anything.',
                            ],
                            'pinecone_id' => [
                                'type'        => 'string',
                                'description' => 'Pinecone Id of the original data item. Be very careful to make sure you have the right pinecone_id',
                            ],
                            'question_id' => [
                                'type'        => 'number',
                                'description' => 'Numeric ID of the GettingStarted question. Be very careful to make sure you have the right question_id',
                            ],
                        ],
                        'required' => ['data', 'pinecone_id', 'question_id'],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'markQuestionAsComplete',
                    'description' => 'Mark the question as complete after receiving a response from the user.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'question_id' => [
                                'type'        => 'number',
                                'description' => 'Numeric ID of the GettingStarted question. Be very careful to make sure you have the right question_id',
                            ],
                        ],
                        'required' => ['question_id'],
                    ],
                ],
            ],
            [
                'type'     => 'function',
                'function' => [
                    'name'        => 'addData',
                    'description' => 'Add new data if no existing data is found in the database.',
                    'parameters'  => [
                        'type'       => 'object',
                        'properties' => [
                            'data' => [
                                'type'        => 'string',
                                'description' => 'The data provided by the user to add to the onboarding system.',
                            ],
                        ],
                        'required' => ['data'],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Handle function calls for onboarding tasks.
     *
     * @param string $functionName
     * @param array $arguments
     * @param string $orgId
     * @param string $pulseId
     * @return string
     */
    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        switch ($functionName) {
            case 'getNextGettingStartedQuestion':
                return $this->gettingStartedHelper->getNextQuestionText(
                    $orgId,
                    $pulseId,
                );
            case 'markQuestionAsComplete':
                $this->gettingStartedHelper->markQuestionAsComplete(
                    $orgId,
                    $pulseId,
                    $arguments['question_id'],
                );
                return 'Thanks, the question has been marked as complete.  You can thank the user and then ask me for the next question.';
            case 'editData':
                Log::info(
                    '************** Getting started editData arguments: ' .
                        json_encode($arguments),
                );
                $pineconeId       = $arguments['pinecone_id'] ?? null;
                $gettingStartedId = $arguments['question_id'] ?? null;

                if ($pineconeId) {
                    UpdateVectorByPineconeIdJob::dispatch(
                        $orgId,
                        $pineconeId,
                        $arguments['data'],
                        $pulseId,
                    );
                    // After dispatching the job, mark the question as complete using its ID
                    if ($gettingStartedId) {
                        $this->gettingStartedHelper->markQuestionAsComplete(
                            $orgId,
                            $pulseId,
                            $gettingStartedId,
                        );
                    } else {
                        Log::error(
                            'No Getting Started ID provided for marking as complete.',
                        );
                    }
                    return "Data successfully sent to the VectorDB for item $pineconeId. It may take a few moments to update in the knowledge base. Don't forget to thank the user and then ask me for the next question. ";
                }

                // Fallback behavior if no Pinecone ID is provided
                return 'Edit request could not be completed without a valid Pinecone ID.';

            case 'addData':
                // Dispatch AddDataToVectorDB job without an itemId
                AddDataToVectorDB::dispatch(
                    $arguments['data'],
                    $this->orgId,
                    $this->pulseId,
                );

                Log::info('Dispatched AddDataToVectorDB job to add new data.');
                return 'Data successfully added to vector DB.  You can ask for the next question now.';

            default:
                return parent::handleFunctionCall(
                    $functionName,
                    $arguments,
                    $orgId,
                    $pulseId,
                    $threadId,
                    $messageId,
                );
        }
    }

    /**
     * Override matching BaseAgent exactly.
     */
    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
        ?array $responseSchema = null,
    ): string {
        $last = $messages->last();
        $text = $last['content'] ?? '';

        return $this->processGettingStartedThread(
            $text,
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
        );
    }

    /**
     * Process an incoming message and manage the onboarding conversation loop.
     *
     * @param string $message
     * @param User $user
     * @param string $orgId
     * @param string $pulseId
     * @param string $parentThreadId
     * @return string Response message from the onboarding process
     */
    public function processGettingStartedThread(
        string $message,
        User $user,
        string $orgId,
        string $pulseId,
        string $parentThreadId,
    ): string {
        $this->user    = $user;
        $this->orgId   = $orgId;
        $this->pulseId = $pulseId;
        // Initialize or retrieve an onboarding system thread
        $systemThread = SystemThread::firstOrCreate([
            'task_type'        => 'gettingStarted',
            'organization_id'  => $orgId,
            'user_id'          => $user->id,
            'pulse_id'         => $pulseId,
            'parent_thread_id' => $parentThreadId,
            'status'           => 'pending',
        ]);

        // Log the incoming message as a user message in SystemMessages
        SystemMessage::create([
            'system_thread_id' => $systemThread->id,
            'role'             => 'user',
            'content'          => $message,
        ]);

        // Run the onboarding loop with the new message
        return $this->processOnboardingLoop($systemThread, $user);
    }

    /**
     * Run the onboarding conversation loop.
     *
     * @param SystemThread $systemThread
     * @param User $user
     * @return string The response generated by the AI
     */
    private function processOnboardingLoop(
        SystemThread $systemThread,
        User $user,
    ): string {
        $continueConversation = true;
        $responseContent      = '';

        while ($continueConversation) {
            // Gather message history for the conversation
            $messageHistory = SystemMessage::where(
                'system_thread_id',
                $systemThread->id,
            )
                ->orderBy('id', 'asc')
                ->get();
            /* Log::info(
                '************** Getting started messageHistory: ' .
                    json_encode($messageHistory),
            );*/

            // Format messages for AI processing
            $formattedMessages = $this->formatMessages($messageHistory);
            Log::info(
                '[Getting started agent] formattedMessages: ' .
                    json_encode($formattedMessages),
            );

            // Prepare the system prompt
            $systemPrompt = [
                [
                    'role'    => 'system',
                    'content' => $this->getSystemPrompt(),
                ],
            ];

            // Retrieve the function calls specifically for this agent
            $functionCalls = $this->getFunctionCalls();

            // Merge everything together for the message params
            $params = array_merge($systemPrompt, $formattedMessages);
            /*  Log::info(
        '************** Getting started params: ' . json_encode($params),
      ); */

            // Send messages to AI for response generation
            $response = $this->openAI->chat()->create([
                'model'    => config('zunou.openai.model'),
                'messages' => $params,
                'tools'    => $functionCalls,
                'n'        => 1,
            ]);

            // Get the assistant's response message content
            $message        = $response['choices'][0]['message'] ?? null;
            $messageContent = $message['content'];
            Log::info(
                '[Getting started agent] ai response: ' . json_encode($response),
            );

            // Check for tool calls in the response and encode them if present
            $toolCallsArray = isset($message['tool_calls'])
                ? json_encode($message['tool_calls'])
                : null;

            // Save the assistant's response with tool calls (if any)
            $assistantMessage = SystemMessage::create([
                'system_thread_id' => $systemThread->id,
                'role'             => 'assistant',
                'content'          => $messageContent,
                'tool_calls'       => $toolCallsArray, // Encode tool calls immediately, preserving original structure
                'is_system'        => true,
            ]);

            // Process any function calls in the AI response
            if (
                isset($message['tool_calls']) && is_array($message['tool_calls'])
            ) {
                foreach ($message['tool_calls'] as $toolCall) {
                    $functionName = $toolCall['function']['name'] ?? null;
                    $arguments    = json_decode(
                        $toolCall['function']['arguments'] ?? '',
                        true,
                    );

                    if (
                        $functionName && json_last_error() === JSON_ERROR_NONE
                    ) {
                        // Handle the function call and retrieve the response content
                        $responseContent = $this->handleFunctionCall(
                            $functionName,
                            $arguments,
                            $this->orgId,
                            $this->pulseId,
                            $systemThread->id,
                            null,
                        );
                        Log::info(
                            '************** Function Name: ' .
                                json_encode($functionName),
                        );
                        Log::info(
                            '************** Arguments: ' .
                                json_encode($arguments),
                        );

                        // Store the tool call's response after the assistant message
                        SystemMessage::create([
                            'system_thread_id' => $systemThread->id,
                            'role'             => 'tool',
                            'content'          => $responseContent,
                            'tool_call_id'     => $toolCall['id'],
                            'is_system'        => true,
                        ]);
                    } else {
                        Log::error(
                            'JSON decode error or missing function name in tool calls.',
                        );
                    }
                }
            } else {
                $continueConversation = false;
            }
        }

        return $messageContent;
    }

    public function formatMessages($allMessages): array
    {
        // Ensure $allMessages is treated as an indexed array
        $allMessages = $allMessages->values();

        return $allMessages
            ->map(function ($message) {
                // Apply the check only if the role is 'user'
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

                // Decode tool_calls if it is set and is a JSON string
                if (
                    isset($message['tool_calls']) && is_string($message['tool_calls'])
                ) {
                    $decodedToolCalls = json_decode(
                        $message['tool_calls'],
                        true,
                    );
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $result['tool_calls'] = $decodedToolCalls;
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
            ->filter() // Remove any null values from the collection
            ->values() // Reset keys to ensure it is a proper array
            ->toArray();
    }
}
