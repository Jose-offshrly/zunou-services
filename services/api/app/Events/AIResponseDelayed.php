<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AIResponseDelayed implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $pulseId;
    public array $payload;

    public function __construct(string $pulseId, array $payload)
    {
        $this->pulseId = $pulseId;
        $this->payload = $payload;
    }

    public function broadcastOn(): array
    {
        return [new Channel('pulse-chat.' . $this->pulseId)];
    }

    public function broadcastAs()
    {
        return 'message.delayed';
    }

    public function broadcastWith()
    {
        return $this->payload;
    }
}
