<?php

namespace App\Events;

use App\Models\NotificationContext;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationProcessed implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public NotificationContext $notificationContext;
    public string $pulseId;

    public function __construct(
        NotificationContext $notificationContext,
        string $pulseId,
    ) {
        //
        $this->notificationContext = $notificationContext;
        $this->pulseId             = $pulseId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('notification-processed.' . $this->pulseId)];
    }

    public function broadcastAs(): string
    {
        return 'notification-processed';
    }

    public function broadcastWith(): array
    {
        return [
            'notificationId' => $this->notificationContext->notification_id,
            'summaryId'      => $this->notificationContext->summary_id,
        ];
    }
}
