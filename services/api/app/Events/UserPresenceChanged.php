<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserPresenceChanged implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $userId;
    public string $presence;

    public function __construct(string $userId, string $presence)
    {
        $this->userId   = $userId;
        $this->presence = $presence;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('users.presence')];
    }

    public function broadcastAs(): string
    {
        return 'user-presence-changed';
    }

    public function broadcastWith(): array
    {
        return [
            'userId'   => $this->userId,
            'presence' => $this->presence,
        ];
    }
}
