<?php

namespace App\Services;

use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agents\GenericAdminAgent;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class CreateCompletionService
{
    protected $messageProcessor;
    public static array $callbacks = [];

    public function __construct(MessageProcessingService $messageProcessor)
    {
        $this->messageProcessor = $messageProcessor;
    }

    public static function clearCallbacks(): void
    {
        self::$callbacks = [];
    }

    public static function perform(
        Collection $messages,
        $thread,
        User $user,
        Message $message,
    ): string {
        //Retrieve the pulse and find the pulse type
        $pulse = $thread->pulse;

        $querySpecificContext = self::extractContextInLastUserMessage(
            $messages,
            $message,
        );

        // Retrieve the correct agent based on pulseType
        $agent = app(AgentService::class)->getAgent(
            $pulse,
            $thread->type, // eg : admin / user
            $querySpecificContext,
        );

        return MessageProcessingService::getInstance()->processMessages(
            $messages,
            $thread,
            $agent,
            $user,
            $message->id,
        );
    }

    /**
     * Generates a suitable title for a thread based on its messages.
     *
     * @param Collection $messages
     * @return string
     */
    public static function generateTitleFromMessages(
        Collection $messages,
    ): string {
        $openAI = \OpenAI::client(Config::get('zunou.openai.api_key'));

        // Prepare the messages in the format required by the OpenAI API
        $formattedMessages = $messages
            ->map(function ($message) {
                return [
                    'role'    => 'user',
                    'content' => $message->content,
                ];
            })
            ->toArray();

        // Log the formatted messages for debugging purposes
        Log::info(
            'Formatted messages for title generation:',
            $formattedMessages,
        );

        // Send a request to OpenAI's API to generate a title
        $response = $openAI->chat()->create([
            'model'    => Config::get('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => "Generate a concise and relevant title for the following conversation, be a little creative, don't just call it 'New onboarding thread':",
                ],
                ...$formattedMessages,
            ],
            'max_tokens' => 10, // Limit the length of the generated title
            'n'          => 1,
        ]);

        // Extract the generated title from the API response
        $title = $response['choices'][0]['message']['content'] ?? 'Untitled Thread';

        // Log the generated title for debugging purposes
        Log::info('Generated thread title:', ['title' => $title]);

        return $title;
    }

    private static function extractContextInLastUserMessage(
        Collection $messages,
        ?Message $currAiMessage = null,
    ) {
        // get the last message where role = "user", it is ordered as oldest to latest
        $reversedMessages = $messages->reverse();

        // Find the first message where role is "user"
        $userMessage = $reversedMessages->first(function ($message) {
            return $message['role'] === 'user';
        });
        $metadata = isset($userMessage['metadata'])
            ? $userMessage['metadata']
            : null;

        if ($currAiMessage) {
            if ($currAiMessage && $currAiMessage->topic_id) {
                $metadata['topic_id'] = $currAiMessage->topic_id;
            }
        }

        return $metadata;
    }

    public static function registerCallback(callable $callback): void
    {
        self::$callbacks[] = $callback;
    }
}
