<?php

namespace App\Events;

use App\Models\MeetingSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeetingSessionStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public MeetingSession $meetingSession;

    /**
     * Create a new event instance.
     */
    public function __construct(MeetingSession $meetingSession)
    {
        $this->meetingSession = $meetingSession;
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
                'meeting-session.' .
                    $this->meetingSession->organization_id .
                    '.pulse.' .
                    $this->meetingSession->pulse_id,
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'meeting-session-status-updated';
    }
}
