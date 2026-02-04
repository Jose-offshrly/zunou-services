<?php

namespace App\Events;

use App\Models\MeetingSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CompanionStatusEvent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public MeetingSession $meetingSession,
        public array $data,
    ) {
    }

    public function broadcastOn(): array
    {
        $channels = [
            new Channel('companion-status.' . $this->meetingSession->id),
        ];

        if (isset($this->meetingSession->dataSource)) {
            $channels[] = new Channel(
                'companion-data-source-status.' .
                    $this->meetingSession->dataSource->id,
            );
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'companion-status-updated';
    }

    public function broadcastWith(): array
    {
        return [
            'meetingSessionId' => $this->meetingSession->id,
            'userId'           => $this->meetingSession->user?->id ?? $this->meetingSession->created_by,
            'data'             => $this->data,
        ];
    }
}
