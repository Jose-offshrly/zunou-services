<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamUserTyping
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $teamThreadId;
    public User $user;

    public function __construct(string $teamThreadId, User $user)
    {
        $this->teamThreadId = $teamThreadId;
        $this->user         = $user;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('team.thread.' . $this->teamThreadId)];
    }
}
