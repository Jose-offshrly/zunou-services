<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StrategiesUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $organization_id;
    public string $pulse_id;

    /**
     * Create a new event instance.
     */
    public function __construct(string $organization_id, string $pulse_id)
    {
        $this->organization_id = $organization_id;
        $this->pulse_id        = $pulse_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel(
                'strategies.' .
                    $this->organization_id .
                    '.pulse.' .
                    $this->pulse_id,
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'strategies-updated';
    }
}
