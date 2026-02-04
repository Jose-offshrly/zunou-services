<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GoogleCalendarSyncCompleted implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public User $user;

    public array $syncResult;

    public string $organizationId;

    /**
     * Create a new event instance.
     */
    public function __construct(
        User $user,
        array $syncResult,
        string $organizationId,
    ) {
        $this->user           = $user;
        $this->syncResult     = $syncResult;
        $this->organizationId = $organizationId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('calendar-sync.organization.' . $this->organizationId),
        ];

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'google-calendar-sync-completed';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'userId'         => $this->user->id,
            'userEmail'      => $this->user->email,
            'organizationId' => $this->organizationId,
            'syncResult'     => $this->syncResult,
            'timestamp'      => now()->toIso8601String(),
        ];
    }
}
