<?php

namespace App\Events;

use App\Models\Meeting;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EventActionablesCompleted implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public Meeting $meeting;
    public string $eventId;
    public array $actionables;
    public string $organizationId;

    /**
     * Create a new event instance.
     */
    public function __construct(
        Meeting $meeting,
        string $eventId,
        array $actionables,
        string $organizationId,
    ) {
        $this->meeting        = $meeting;
        $this->eventId        = $eventId;
        $this->actionables    = $actionables;
        $this->organizationId = $organizationId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [new Channel('actionables.event.' . $this->eventId)];

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'event-actionables-completed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'eventId'        => $this->eventId,
            'meetingId'      => $this->meeting->id,
            'pulseId'        => $this->meeting->pulse_id,
            'organizationId' => $this->organizationId,
            'actionables'    => $this->actionables,
        ];
    }
}
