<?php

namespace App\Services\Agents\Helpers;

use App\Models\Pulse;
use App\Models\User;
use App\Schemas\WelcomeMessageSchema;
use App\Services\Agents\Traits\LLMResponseTrait;
use App\Services\OpenAIService;
use App\Services\VectorDBService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class PulseWelcomeMessageHelper
{
    use LLMResponseTrait;

    protected $vectorDBService;
    protected $pulse;
    protected $openaiService;
    protected $openAI;

    public function __construct($pulse = null)
    {
        $this->vectorDBService = new VectorDBService();
        $this->pulse           = $pulse;
        $this->openaiService   = new OpenAIService($pulse);
        $this->openAI          = \OpenAI::client(config('zunou.openai.api_key'));
    }

    /**
     * Generate a welcome message for a user returning to a pulse
     *
     * @param array $welcomeData Data from PulseWelcomeDataQuery
     * @return array The generated welcome message
     */
    public function generateWelcomeMessage(array $welcomeData)
    {
        $user  = User::find($welcomeData['userId']);
        $pulse = Pulse::find($welcomeData['pulseId']);

        if (! $user || ! $pulse) {
            Log::error(
                '[PulseWelcomeMessageHelper::generateWelcomeMessage] User or Pulse not found',
                [
                    'userId'  => $welcomeData['userId'],
                    'pulseId' => $welcomeData['pulseId'],
                ],
            );
            return [
                'message' => 'Welcome back!',
                'error'   => 'Could not generate a personalized message.',
            ];
        }

        $lastVisited  = $welcomeData['lastVisited'];
        $dataSources  = $welcomeData['dataSources']  ?? collect();
        $meetings     = $welcomeData['meetings']     ?? collect();
        $tasks        = $welcomeData['tasks']        ?? collect();
        $teamMessages = $welcomeData['teamMessages'] ?? collect();

        // Prepare the context for the AI
        $context = $this->prepareContext(
            $user,
            $pulse,
            $lastVisited,
            $dataSources,
            $meetings,
            $tasks,
            $teamMessages,
        );

        // Generate the welcome message
        $message = $this->generateAIWelcomeMessage($context);

        return [
            'message' => $message,
            'data'    => [
                'dataSources'  => count($dataSources),
                'meetings'     => count($meetings),
                'tasks'        => count($tasks),
                'teamMessages' => count($teamMessages),
            ],
        ];
    }

    /**
     * Prepare the context for the AI to generate a welcome message
     */
    private function prepareContext(
        $user,
        $pulse,
        $lastVisited,
        $dataSources,
        $meetings,
        $tasks,
        $teamMessages,
    ) {
        $userName         = $user->name;
        $pulseName        = $pulse->name;
        $pulseDescription = $pulse->description;

        $timeContext = '';
        if ($lastVisited) {
            $now             = Carbon::now();
            $lastVisitedDate = Carbon::parse($lastVisited);
            $diffInDays      = $now->diffInDays($lastVisitedDate);

            if ($diffInDays == 0) {
                $timeContext = 'You were last here earlier today.';
            } elseif ($diffInDays == 1) {
                $timeContext = 'You were last here yesterday.';
            } else {
                $timeContext = "You were last here $diffInDays days ago.";
            }
        } else {
            $timeContext = 'This is your first visit to this pulse.';
        }

        $updatesContext = '';

        if (count($dataSources) > 0) {
            $updatesContext .= '- ' .
                count($dataSources) .
                ' new data source' .
                (count($dataSources) > 1 ? 's' : '') .
                " added\n";
        }

        if (count($meetings) > 0) {
            $updatesContext .= '- ' .
                count($meetings) .
                ' new meeting' .
                (count($meetings) > 1 ? 's' : '') .
                " created\n";
            // Add meeting titles if available
            foreach ($meetings as $index => $meeting) {
                if (isset($meeting['title']) && $index < 3) {
                    // Limit to 3 meetings
                    $updatesContext .= '  - ' . $meeting['title'] . "\n";
                }
            }
        }

        if (count($tasks) > 0) {
            $updatesContext .= '- ' .
                count($tasks) .
                ' new task' .
                (count($tasks) > 1 ? 's' : '') .
                " created\n";
        }

        if (count($teamMessages) > 0) {
            $updatesContext .= '- ' .
                count($teamMessages) .
                ' new team message' .
                (count($teamMessages) > 1 ? 's' : '') .
                "\n";
        }

        if (empty($updatesContext)) {
            $updatesContext = 'There have been no updates since your last visit.';
        } else {
            $updatesContext = "Here's what's new since your last visit:\n" . $updatesContext;
        }

        $teamMessagesWithSender = [];
        foreach ($teamMessages as $msg) {
            $teamMessagesWithSender[] = [
                'userDetails' => [
                    'id'   => $msg->user->id   ?? null,
                    'name' => $msg->user->name ?? 'Unknown User',
                ],
                'teamMessage' => $msg,
            ];
        }

        return [
            'userName'         => $userName,
            'pulseName'        => $pulseName,
            'pulseDescription' => $pulseDescription,
            'timeContext'      => $timeContext,
            'updatesContext'   => $updatesContext,
            'tasks'            => $tasks,
            'dataSources'      => $dataSources,
            'meetings'         => $meetings,
            'teamMessages'     => $teamMessagesWithSender,
        ];
    }

    /**
     * Generate the AI welcome message using OpenAI
     */
    private function generateAIWelcomeMessage($context)
    {
        $teamMessagesFormatted = '';
        foreach ($context['teamMessages'] as $msg) {
            $senderName = $msg['userDetails']['name'] ?? 'Unknown User';
            $senderId   = $msg['userDetails']['id']   ?? null;
            $teamMessagesFormatted .= "- {$senderName}; ID: {$senderId}: {$msg['teamMessage']->content}\n";
        }

        $prompt = <<<PROMPT
You are a helpful assistant for a team collaboration platform. Generate a warm, personalized welcome message for a user returning to their workspace (called a "pulse").

Use the following information to personalize the message:
- User's name: {$context['userName']}
- Pulse name: {$context['pulseName']}
- Pulse description: {$context['pulseDescription']}
- Time context: {$context['timeContext']}
- Updates context: {$context['updatesContext']}

Here are the updates since their last visit:
- Tasks: {$context['tasks']}
- Data Sources: {$context['dataSources']}
- Meetings: {$context['meetings']}
- Team Messages:
{$teamMessagesFormatted}

If there are tasks:
1. List each task with title and due date.
2. Highlight urgency or next action needed.
3. Make sure that the type of the text is task.

If there are team messages:
1. Mention '#teamchat'.
2. Summarize who said what (include the sender's name), including questions and/or @mentions (e.g., "Alex had a question about API versioning").
3. Don't mention the content of the message (even on mentions), just summarize the essence of the conversation.
4. Make sure that the type of the text is team_message.
5. Include the user ID of the sender in the metadata.

If there is a meeting:
1. Reference the LATEST meeting by name or title.
2. Mention relevant notes/actions derived from it.
3. Surface key takeaways, decisions, or action items relevant to the user.
4. Make sure that the type of the text is meeting.
5. Include the meeting ID in the metadata.

If there are data sources:
1. List any newly added data sources.
2. Include titles/names (e.g., "Q2 Customer Feedback Report").
3. Provide a very short summary or idea about the added data sources.
4. Make sure that the type of the text is data_source.
5. Include the latest data source ID in the metadata.

For other text:
1. Make sure that the type of the text is text.
2. Don't include any metadata for this type.

Guidelines:
1. Keep the message concise but warm and engaging.
2. Mention the user by name.
3. Reference how long it's been since their last visit.
4. Highlight new updates in a clear, organized way.
5. Highlight any messages that are directly relevant to the user.
6. Explain team messages in a way that is relevant to the user.
7. End with a brief, encouraging note.

Formatting:
The AI message will be destructured into an array of objects containing the following properties:
1. text: The actual message content.
2. type: The type of message (e.g., 'text', 'user', 'team_message',).
3. metadata: A dynamic array containing user data, team message, data source data, etc. based on the type. Make sure to include the id if possible.
PROMPT;

        $userMessages = [
            [
                'role'    => 'system',
                'content' => $prompt,
            ],
            [
                'role'    => 'user',
                'content' => "Generate a welcome message for {$context['userName']} returning to {$context['pulseName']}",
            ],
        ];

        $toolModel = AgentConfig::toolModel('general', 'generateWelcomeMessage') ?? config('zunou.openai.reasoning_model');

        try {
            $response = $this->openaiService->createChatCompletion(
                $userMessages,
                [
                    'model'           => 'gpt-4.1-2025-04-14',
                    'temperature'     => 0.5,
                    'response_format' => WelcomeMessageSchema::AI_WELCOME_MESSAGE,
                ],
            );

            $message   = $response['choices'][0]['message']['content'];
            $sentences = json_decode($message, true); // decode to array

            // Optionally, handle decode errors:
            if (! is_array($sentences['messages'])) {
                Log::error(
                    'AI did not return valid JSON array for welcome message',
                    ['content' => $message],
                );
                $sentences = [];
            }

            return $sentences['messages'];
        } catch (\Exception $e) {
            Log::error(
                '[PulseWelcomeMessageHelper::generateAIWelcomeMessage] Error generating welcome message',
                [
                    'message' => $e->getMessage(),
                    'trace'   => $e->getTraceAsString(),
                ],
            );

            // Fallback message if AI generation fails
            return "Welcome back, {$context['userName']}! {$context['timeContext']} {$context['updatesContext']}";
        }
    }
}
