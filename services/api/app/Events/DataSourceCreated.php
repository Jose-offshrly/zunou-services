<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DataSourceCreated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public string $organiztion_id;

    public string $pulse_id;

    /**
     * Create a new event instance.
     */
    public function __construct(string $organiztion_id, string $pulse_id)
    {
        $this->organiztion_id = $organiztion_id;
        $this->pulse_id       = $pulse_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Channel must contain the data source id
        return [
            new Channel(
                'data-source.' .
                    $this->organiztion_id .
                    '.pulse.' .
                    $this->pulse_id,
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'data-source-created';
    }
}
