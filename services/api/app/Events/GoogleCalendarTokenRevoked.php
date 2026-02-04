<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GoogleCalendarTokenRevoked implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public User $user;

    public string $message;

    /**
     * Create a new event instance.
     */
    public function __construct(User $user, string $message)
    {
        $this->user    = $user;
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('calendar-sync.user.' . $this->user->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'google-calendar-token-revoked';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'userId'    => $this->user->id,
            'userEmail' => $this->user->email,
            'message'   => $this->message,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
