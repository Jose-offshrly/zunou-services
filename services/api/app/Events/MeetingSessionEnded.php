<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\MeetingSession;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeetingSessionEnded implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(public MeetingSession $meetingSession)
    {
    }

    public function broadcastOn(): array
    {
        return [
            'meeting-session.' . $this->meetingSession->id,
            'meeting-session-ended.pulse.' . $this->meetingSession->pulse_id,
        ];
    }

    public function broadcastAs(): string
    {
        return 'meeting-session-ended';
    }
}
