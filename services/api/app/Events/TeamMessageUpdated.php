<?php

namespace App\Events;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamMessageUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public TeamMessage $teamMessage;

    public function __construct(TeamMessage $teamMessage)
    {
        $this->teamMessage = $teamMessage;
    }

    public function broadcastOn(): array
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);

        return [
            new PresenceChannel('team.thread.' . $teamThread->pulse_id),
            new Channel('team-messages.' . $teamThread->organization_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'team-message-updated';
    }

    public function broadcastWith(): array
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);
        $pulseName  = $teamThread->pulse?->name;

        return [
            'userId'            => $this->teamMessage->user_id,
            'organizationId'    => $teamThread->organization_id,
            'pulseId'           => $teamThread->pulse_id,
            'pulseName'         => $pulseName,
            'name'              => $this->teamMessage->user->name,
            'message'           => $this->teamMessage->content,
            'replyTeamThreadId' => $this->teamMessage->reply_team_thread_id,
            'metadata'          => $this->teamMessage->metadata,
            'teamMessageId'     => $this->teamMessage->id,
            'timestamp'         => now()->toIso8601String(),
        ];
    }
}
