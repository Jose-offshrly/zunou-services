<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FireFliesMeetingSynced implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public string $pulse_id)
    {
    }

    public function broadcastOn(): array
    {
        return ['pulse.' . $this->pulse_id];
    }

    public function broadcastAs(): string
    {
        return 'meetings-synced';
    }
}
