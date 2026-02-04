<?php

namespace App\Listeners;

use App\Enums\MessageStatus;
use App\Events\AiResponseComplete;
use App\Events\StartCompletionEvent;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\CreateCompletionService;
use App\Services\OpenAIService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class StartCompletionEventListener implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(StartCompletionEvent $event): void
    {
        $this->startCompletion(
            organizationId: $event->organizationId,
            thread: $event->thread,
            user: $event->user,
            message: $event->message,
        );
    }

    private function startCompletion(
        string $organizationId,
        Thread $thread,
        User $user,
        Message $message,
    ): void {
        $lastThreeUserMessages = collect();
        $messages = collect(); // Declare outside try for error handling
        try {
            $messages = Message::where('organization_id', $organizationId)
                ->where('thread_id', $thread->id)
                ->whereNot('id', $message->id)
                ->where('topic_id', $message->topic_id)
                ->orderBy('updated_at', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $processedMessages = $messages->map(function ($message) {
                // Optimize: Only decode and check errors when tool_calls exists
                $toolCalls = null;
                if ($message->tool_calls) {
                    $decoded = json_decode($message->tool_calls, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $toolCalls = $decoded;
                    } else {
                        Log::error(
                            'JSON decode error in tool_calls: ' . json_last_error_msg(),
                        );
                    }
                }
                
                $newContent = $message->content;
                // Optimize: Check if metadata is array/object before processing
                if ($message->metadata && (is_array($message->metadata) || is_object($message->metadata))) {
                    try {
                        $formattedMetadata = json_encode($message->metadata);
                        $newContent        = "{$message->content} (for this message only, refer to: {$formattedMetadata})";
                    } catch (\Throwable $th) {
                        Log::error(
                            'Error encoding metadata: ' . $th->getMessage(),
                            [
                                'metadata' => $message->metadata,
                            ],
                        );
                    }
                }

                // Prepare the returned structure
                return [
                    'role'         => $message->role,
                    'content'      => $newContent,
                    'tool_calls'   => $toolCalls,
                    'tool_call_id' => $message->tool_call_id,
                    'metadata'     => $message->metadata,
                ];
            });

            $startTime = microtime(true);
            $reply = CreateCompletionService::perform(
                $processedMessages,
                $thread,
                $user,
                $message,
            );

            $endTime = microtime(true);
            Log::info('CreateCompletionService::perform time: ' . ($endTime - $startTime) . ' seconds');

            if (is_string($reply)) {
                $decoded = json_decode($reply, true);

                if (
                    json_last_error() === JSON_ERROR_NONE && is_array($decoded) && (count($decoded) === 1 || (count($decoded) === 2 && empty($decoded['ui']))) && array_key_exists('message', $decoded)
                ) {
                    $reply = $decoded['message'] ?? $reply;
                }
            }

            $payload = [
                'content'         => $reply,
                'organization_id' => $organizationId,
                'role'            => 'assistant',
                'thread_id'       => $thread->id,
                'topic_id'        => $message->topic_id,
                'user_id'         => $user->id,
                'status'          => MessageStatus::COMPLETE->value,
            ];

            $message->update($payload);

            /*
             * Run the post processing callbacks
             * Example: adding clickable links after the final message
             */
            foreach (CreateCompletionService::$callbacks as $callback) {
                try {
                    $callback($organizationId, $thread, $user, $message);
                } catch (\Throwable $th) {
                    Log::error('Callback failed: ' . $th->getMessage(), [
                        'message_id' => $message->id,
                        'thread_id'  => $thread->id,
                        'exception'  => $th,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error('AI Completion failed: ' . $e->getMessage(), [
                'message_id' => $message->id,
                'thread_id'  => $thread->id,
                'exception'  => $e,
            ]);

            // Optimize: Only compute lastThreeUserMessages when needed (error case)
            if ($lastThreeUserMessages->isEmpty() && $messages->isNotEmpty()) {
                $lastThreeUserMessages = $messages
                    ->reverse()
                    ->filter(fn ($msg) => $msg->is_system === false)
                    ->take(6)
                    ->reverse()
                    ->values();
            }

            $friendlyErrorMsg = $this->generateFriendlyErrorMessage(
                $lastThreeUserMessages,
            );

            $message->update([
                'content' => $friendlyErrorMsg,
                'status'  => MessageStatus::FAILED->value,
            ]);
        } finally {
            CreateCompletionService::clearCallbacks();
        }

        AiResponseComplete::dispatch($message);
    }

    public function generateFriendlyErrorMessage($lastThreeUserMessages): string
    {
        $prompt = <<<PROMPT
You are a helpful assistant inside a chat application.
When something goes wrong, your job is to generate a short, friendly, and non-technical error message in response to the user's query.

You are part of the same system the user is interacting with — speak as the system itself, not a separate assistant.

Guidelines:
1. Keep the message warm and easy to understand.
2. Do NOT include technical jargon, system error codes, or internal failure details.
3. Do NOT make up or assume any information.
4. Write from the perspective of the system that failed to complete the user’s request.
5. Keep the message under 15 words.
6. Only respond with the message, nothing else.

Examples:

**User:** “Create a summary for the latest meeting.”  
**Response:** “Tried creating the summary, but something didn’t work.”

**User:** “Assign this task to John.”  
**Response:** “Tried assigning the task, but couldn’t finish.”

**User:** “Generate a timeline.”  
**Response:** “That didn’t go through. Want to try again?”

**User:** “Who’s working on this?”  
**Response:** “Wasn’t able to fetch that right now. Try again soon.”

**User:** “Create a follow-up task.”  
**Response:** “Tried setting that up, but ran into an issue.”
PROMPT;
        try {
            $lastThreeUserMessages = $lastThreeUserMessages->toArray();

            $previousContext = "Here are the previous messages in the conversation for reference:\n\n";
            if (count($lastThreeUserMessages) > 1) {
                // build the context excluding the last message
                $messagesToInclude = array_slice($lastThreeUserMessages, 0, -1);
                foreach ($messagesToInclude as $msg) {
                    $previousContext .= "{$msg['role']}: {$msg['content']}\n";
                }
            }

            $content    = end($lastThreeUserMessages)['content'];
            $userPrompt = <<<PROMPT
Here's the user’s message that caused the error:
$content

$previousContext
PROMPT;

            $params = [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
                [
                    'role'    => 'user',
                    'content' => $userPrompt,
                ],
            ];

            $response = OpenAIService::createCompletion([
                'model'    => config('zunou.openai.reasoning_model'),
                'messages' => $params,
                'n'        => 1,
            ]);

            $assistant = $response['choices'][0]['message'];

            return $assistant['content'] ?? 'Oops something went wrong. Please try again later.';
        } catch (\Throwable $th) {
            return 'Oops something went wrong. Please try again later.';
        }
    }
}
