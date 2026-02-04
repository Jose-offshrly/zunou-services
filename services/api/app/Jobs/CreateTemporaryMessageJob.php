<?php

namespace App\Jobs;

use App\Events\AIResponseDelayed;
use App\Models\Message;
use App\Services\OpenAIService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CreateTemporaryMessageJob implements ShouldQueue
{
    use Queueable;

    private string $organizationId;
    private Message $message;
    private string $pulseId;
    /**
     * Create a new job instance.
     */
    public function __construct(Message $message, string $pulseId)
    {
        $this->message = $message;
        $this->pulseId = $pulseId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $ai_message = $this->generateFriendlyMessage($this->message);

        if ($ai_message) {
            AIResponseDelayed::dispatch($this->pulseId, [
                'message' => $ai_message,
                'data'    => [
                    'message_id' => $this->message->id,
                    'ai_message' => $ai_message,
                ],
            ]);
        }
    }

    public static function generateFriendlyMessage($message): ?string
    {
        try {
            $prompt = <<<PROMPT
You are a friendly assistant in a chat application.

The user has submitted a query that may take some time to complete.

Your job is to respond with a short, warm, and non-technical message that acknowledges the request and informs the user it’s being processed.

Important behavior rules:

1. If the query clearly relates to one of these categories, respond with the exact predefined message:

   - Create Task → One moment — creating your task...
   - Get Tasks → Let me find your tasks...
   - Meeting Summary → Summarizing your meeting now...
   - Get User Info → Checking that for you...
   - Ask Data Source → Looking that up for you...

2. If the query does not match any of the above, generate a short, warm message that:
   - Acknowledges the request is in progress
   - Contains no technical jargon, system codes, or speculative content
   - Is 10 words or fewer
   - Sounds polite, human, and reassuring
   - Is the only output — no preamble, no markdown, no explanations

4. If the user is greeting, you should not respond to the greeting. This process is very fast no need to respond to the greeting.

Here's the current message:
$message->content

---

Only return the message — no JSON, no tags, no formatting. Just the message text.
Do not respond to the user query even if it is just a greeting. Stick to the rules.
PROMPT;

            $params = [
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ];

            // TODO: Incase only want to generate loader message for specific slow queries
            // $slow_query_operations = ['meeting_summary', 'query_data_sources', 'create_tasks'];

            $fmt = [
                'type'        => 'json_schema',
                'json_schema' => [
                    'name'   => 'FriendlyMessage',
                    'schema' => [
                        'type'       => 'object',
                        'properties' => [
                            'loader_message' => [
                                'type'        => 'string',
                                'description' => 'The concise loader message to display to the user while the operation is in progress.',
                            ],
                            'is_greeting' => [
                                'type'        => 'boolean',
                                'description' => 'Whether the original query is a greeting.',
                            ],
                            'is_pulse_question' => [
                                'type'        => 'boolean',
                                'description' => 'Default false. Whether the original query is a pulse question meaning asking about the pulse itself, what it can do, etc.',
                            ],
                        ],
                        'required' => [
                            'loader_message',
                            'is_greeting',
                            'is_pulse_question',
                        ],
                        'additionalProperties' => false,
                    ],
                    'strict' => true,
                ],
            ];

            $response = OpenAIService::createCompletion([
                'model'           => 'gpt-4.1-mini-2025-04-14',
                'messages'        => $params,
                'n'               => 1,
                'response_format' => $fmt,
            ]);

            $message = $response['choices'][0]['message']['content'];
            $message = json_decode($message, true);

            Log::debug('Friendly loading message response: ', $message);

            if ($message['is_greeting'] || $message['is_pulse_question']) {
                return null;
            }

            $content = $message['loader_message'];

            return $content ?? 'Got it — working on that for you now...';
        } catch (\Throwable $th) {
            Log::error('Friendly loading message error: ' . $th->getMessage());
            return 'Got it — working on that for you now...';
        }
    }
}
