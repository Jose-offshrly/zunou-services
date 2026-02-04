<?php

namespace App\Events;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReplyGenerationStarted implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public TeamMessage $message, public User $user)
    {
    }

    public function broadcastOn(): PresenceChannel
    {
        $teamThread = TeamThread::find($this->message->team_thread_id);

        return new PresenceChannel(
            'reply.team.thread.' .
                $teamThread->pulse_id .
                '.' .
                $this->message->reply_team_thread_id,
        );
    }

    public function broadcastAs(): string
    {
        return 'ai-reply-generation-started';
    }

    public function broadcastWith(): array
    {
        return [
            'userId'            => $this->message->user_id,
            'message'           => $this->message->content,
            'replyTeamThreadId' => $this->message->reply_team_thread_id,
            'metadata'          => $this->message->metadata,
        ];
    }
}
