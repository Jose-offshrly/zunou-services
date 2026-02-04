<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReplyTeamUserTyping
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $pulseId;
    public string $replyTeamThreadId;
    public User $user;

    public function __construct(
        string $pulseId,
        string $replyTeamThreadId,
        User $user,
    ) {
        $this->pulseId           = $pulseId;
        $this->replyTeamThreadId = $replyTeamThreadId;
        $this->user              = $user;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel(
                'reply.team.thread.' .
                    $this->pulseId .
                    '.' .
                    $this->replyTeamThreadId,
            ),
        ];
    }
}
