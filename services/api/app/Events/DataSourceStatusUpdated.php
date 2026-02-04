<?php

namespace App\Events;

use App\Models\DataSource;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DataSourceStatusUpdated implements ShouldBroadcast
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
        # Channel must contain the data source id
        return [new Channel('data-source.' . $this->dataSource->id)];
    }

    public function broadcastAs(): string
    {
        return 'data-source-status-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'      => $this->dataSource->id,
            'status'  => $this->dataSource->status,
            'summary' => $this->dataSource->summary ?? '',
        ];
    }
}
