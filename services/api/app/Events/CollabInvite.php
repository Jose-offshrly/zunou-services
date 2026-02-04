<?php

namespace App\Events;

use App\Models\MeetingSession;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CollabInvite implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public MeetingSession $meetingSession,
        private User $user,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            'collab-invite.' .
            $this->user->id .
            '.pulse.' .
            $this->meetingSession->pulse_id,

            'collab-invite.' .
            $this->user->id .
            '.organization.' .
            $this->meetingSession->organization_id,
        ];
    }

    public function broadcastAs(): string
    {
        return 'collab-invite';
    }
}
