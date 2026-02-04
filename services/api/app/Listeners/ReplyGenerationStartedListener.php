<?php

namespace App\Listeners;

use App\Events\AIReplyCompleted;
use App\Events\ReplyGenerationStarted;
use App\Events\TeamMessageSent;
use App\Events\TeamMessageUpdated;
use App\Helpers\PulseHelper;
use App\Models\TeamMessage;
use App\Services\Agents\TeamChatAgent;
use App\Services\TeamChatMessageProcessingService;
use Illuminate\Contracts\Queue\ShouldQueue;

class ReplyGenerationStartedListener implements ShouldQueue
{
    protected $openAI;

    public function __construct()
    {
        $this->openAI = \OpenAI::client(config('zunou.openai.api_key'));
    }

    /**
     * Handle the event.
     */
    public function handle(ReplyGenerationStarted $event): void
    {
        $teamMessage  = $event->message;
        $user         = $event->user;
        $mainThread   = $teamMessage->teamThread;
        $replyThread  = $teamMessage->replyTeamThread;
        $activeThread = $teamMessage->replyTeamThread ?? $mainThread;
        $topicId      = $teamMessage->topic_id ?? null;

        $agent     = new TeamChatAgent($mainThread->pulse);
        $pulseUser = PulseHelper::getSystemUser();

        // only get the messages before the current message + alll in the reply thread if set
        $endDateTimestamp = null;

        // assuming reply thread is always present since ai only works on reply threads
        // set timestamp of the first message in the reply thread
        if ($teamMessage->is_parent_reply) {
            $endDateTimestamp = $teamMessage->created_at;
        } else {
            $parentMessage = $teamMessage->replyTeamThread
                ->teamMessages()
                ->where('is_parent_reply', true)
                ->first();
            $endDateTimestamp = $parentMessage->created_at;
        }

        $mainThreadMessages  = $mainThread->getThreadMessages($endDateTimestamp, $topicId);
        $replyThreadMessages = $replyThread->getThreadMessages($topicId);

        $allMessages = collect(
            array_merge(
                $mainThreadMessages->toArray(),
                $replyThreadMessages->toArray(),
            ),
        );

        $reply = TeamChatMessageProcessingService::getInstance()->processMessages(
            $allMessages,
            $activeThread,
            $agent,
            $user,
            $teamMessage,
        );

        if ($teamMessage->is_parent_reply) {
            $descriptiveReply = $this->createDescriptiveReply(
                array_slice(
                    array_filter($allMessages->toArray(), function ($item) {
                        return ! $item['is_system'];
                    }),
                    -10,
                ),
                $teamMessage,
                $reply,
            );

            $currentMetadata = $teamMessage->metadata ?? [];
            $metadata        = array_merge($currentMetadata, [
                'status'  => 'COMPLETE',
                'excerpt' => $descriptiveReply,
            ]);

            $teamMessage->metadata = $metadata;
            $teamMessage->save();

            TeamMessageUpdated::dispatch($teamMessage->refresh());
        }

        $aiReply = TeamMessage::create([
            'team_thread_id'       => $teamMessage->team_thread_id,
            'user_id'              => $pulseUser->id,
            'reply_team_thread_id' => $teamMessage->reply_team_thread_id,
            'content'              => $reply,
            'role'                 => 'assistant',
        ]);

        // Dispatch both events for the AI reply
        TeamMessageSent::dispatch($aiReply->refresh());
        AIReplyCompleted::dispatch($aiReply->refresh());
    }

    private function createDescriptiveReply(
        array $previousMessages,
        TeamMessage $message,
        string $reply,
    ) {
        $previousMessagesString = '';
        foreach ($previousMessages as $prevMessage) {
            $content  = $prevMessage['content'];
            $userName = $prevMessage['role'] == 'user'
                    ? $prevMessage['user']['name']
                    : 'you';
            $previousMessagesString .= "[$userName] $content\n";
        }
        $params = [
            [
                'role'    => 'system',
                'content' => "Create a very short reply to the user's query. Keep it short and acts like you are a human in a conversation.\n
                
                Here's the users query:\n
                $message->content \n

                Here's your response stored internally:\n
                $reply \n

                Now create a very short reply on users query, It's like you are acknowledging the users question.\n\n
                Examples:\n

                User: give me the meeting summary that happen yesterday\n
                Expected output: Meeting summary shared\n\n

                The users query might be a followed up message, thus the main thought is in previous messages. Example 'try again'. In This case you will use the previous messages for context.
                Previous messages: $previousMessagesString

                Notice how the expected output is structured, very short yet properly replied on the user's query.\n
                Keep the reply in past tense as well.\n
                ",
            ],
        ];

        $response = $this->openAI->chat()->create([
            'model'    => config('zunou.openai.model'),
            'messages' => $params,
            // 'temperature' => 0.7,
        ]);

        return $response['choices'][0]['message']['content'];
    }
}
