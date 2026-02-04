<?php

namespace App\Events;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AIReplyCompleted implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public TeamMessage $teamMessage;

    public function __construct(TeamMessage $teamMessage)
    {
        $this->teamMessage = $teamMessage;
    }

    public function broadcastOn(): PresenceChannel
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);

        return new PresenceChannel(
            'reply.team.thread.' .
                $teamThread->pulse_id .
                '.' .
                $this->teamMessage->reply_team_thread_id,
        );
    }

    public function broadcastAs(): string
    {
        return 'ai-reply-completed';
    }

    public function broadcastWith(): array
    {
        return [
            'userId'            => $this->teamMessage->user_id,
            'message'           => $this->teamMessage->content,
            'replyTeamThreadId' => $this->teamMessage->reply_team_thread_id,
            'metadata'          => $this->teamMessage->metadata,
        ];
    }
}
