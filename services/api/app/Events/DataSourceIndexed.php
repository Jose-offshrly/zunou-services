<?php

namespace App\Events;

use App\Models\DataSource;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DataSourceIndexed implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public DataSource $dataSource;
    /**
     * Create a new event instance.
     */
    public function __construct(DataSource $dataSource)
    {
        $this->dataSource = $dataSource;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('data-source.' . $this->dataSource->id)];
    }

    public function broadcastAs(): string
    {
        return 'data-source-indexed';
    }

    public function broadcastWith(): array
    {
        return [
            'userId' => $this->dataSource->creator?->id ?? $this->dataSource->created_by,
        ];
    }
}
