<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecurringMeetingSessionsCreated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly string $pulseId,
        public readonly string $organizationId,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('meeting-session.' . $this->organizationId . '.pulse.' . $this->pulseId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'recurring-meeting-sessions-created';
    }

    public function broadcastWith(): array
    {
        return [
            'pulse_id'        => $this->pulseId,
            'organization_id' => $this->organizationId,
        ];
    }
}
