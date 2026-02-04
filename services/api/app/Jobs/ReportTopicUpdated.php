<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Topic;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Helpers\PulseHelper;

class ReportTopicUpdated implements ShouldQueue
{
    use Queueable;
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    private Topic $topic;
    /**
     * Create a new job instance.
     */
    public function __construct(string $topicId)
    {
        $this->topic = Topic::find($topicId);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Ensure topic exists
        if (!$this->topic) {
            return;
        }

        // Get the entity (TeamThread or Thread) from the polymorphic relationship
        $entity = $this->topic->entity;

        // Only proceed if the entity is a TeamThread, since TeamMessage requires team_thread_id
        if (!$entity instanceof TeamThread) {
            return;
        }

        $teamThreadId = $entity->id;

        // Get message count from topic
        $topicMessageCount = $this->topic->teamMessages()->count();
        $latestMessages = $this->topic
            ->teamMessages()
            ->with('user:id,name,email')
            ->latest()
            ->take(2)
            ->get()
            ->map(function ($message) {
                $user = $message->user;
                $email = $user ? (string) ($user->email ?? '') : '';
                $hash = md5(strtolower(trim($email)));

                return [
                    'name' => $user ? $user->name : null,
                    'created_at' => (string) $message->created_at,
                    'content' => $message->content,
                    'gravatar' =>
                        'https://www.gravatar.com/avatar/' .
                        $hash .
                        '?s=200&d=retro',
                ];
            })
            ->values()
            ->all();
        $systemUser = PulseHelper::getSystemUser();
        $messageContent = json_encode([
            'message' => 'A new topic has been created: ' . $this->topic->name,
            'ui' => [
                'type' => 'new_topic',
                'topic_id' => $this->topic->id,
                'references' => [
                    [
                        'topic_id' => $this->topic->id,
                        'topic_name' => $this->topic->name,
                        'topic_message_count' => $topicMessageCount,
                        'participants' => $this->getParticipants(),
                        'created_by' => $this->topic->creator->name,
                        'latest_messages' => $latestMessages,
                    ],
                ],
            ],
        ]);

        // Check if there is a team message reference
        if ($this->topic->team_message_reference) {
            $teamMessage = TeamMessage::find(
                $this->topic->team_message_reference
            );
            if ($teamMessage) {
                $teamMessage->content = $messageContent;
                $teamMessage->save();
            }
        } else {
            $teamMessage = TeamMessage::create([
                'team_thread_id' => $teamThreadId,
                'user_id' => $systemUser->id,
                'reply_team_thread_id' => null,
                'is_parent_reply' => false,
                'content' => $messageContent,
                'metadata' => [],
                'role' => 'assistant',
                'is_system' => false,
                'is_from_pulse_chat' => false,
            ]);
            $this->topic->team_message_reference = $teamMessage->id;
            $this->topic->save();
        }
    }

    // Get unique users in the topic that participated in chatting
    private function getParticipants(): array
    {
        $participants = $this->topic
            ->teamMessages()
            ->whereNotNull('user_id')
            ->with('user:id,name,email')
            ->get()
            ->pluck('user')
            ->filter()
            ->unique('id')
            ->map(function ($user) {
                $email = (string) ($user->email ?? '');
                $hash = md5(strtolower(trim($email)));
                $size = 200;
                $default = 'identicon';
                $rating = 'g';

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'gravatar' =>
                        'https://www.gravatar.com/avatar/' .
                        $hash .
                        '?s=' .
                        $size .
                        '&d=' .
                        $default .
                        '&r=' .
                        $rating,
                ];
            })
            ->values()
            ->all();

        return $participants;
    }
}
