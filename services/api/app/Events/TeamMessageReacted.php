<?php

namespace App\Events;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TeamMessageReacted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public TeamMessage $teamMessage;

    public function __construct(TeamMessage $teamMessage)
    {
        $this->teamMessage = $teamMessage;
    }

    /**
     * Broadcast to:
     * - Owner channel (keeps owner-only notifications)
     * - Team thread channel (all participants in team threads)
     * - DM thread channel (all participants in one-to-one threads) — adjust name as needed
     */
    public function broadcastOn(): array
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);

        return [
            new PrivateChannel('team-message-reactions.' . $this->teamMessage->user_id),

            // Team thread (everyone in the team thread)
            new PresenceChannel('team.thread.' . $teamThread->pulse_id),

            // Direct message thread (everyone in the DM thread) — change channel name if yours differs
            new PresenceChannel('thread.' . $teamThread->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'team-message-reacted';
    }

    public function broadcastWith(): array
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);
        $pulseName = $teamThread->pulse?->name;

        return [
            'messageId'      => $this->teamMessage->id,
            'teamThreadId'   => $teamThread->id,
            'topicId'        => $this->teamMessage->topic_id,
            'userId'         => $this->teamMessage->user_id,
            'organizationId' => $teamThread->organization_id,
            'pulseId'        => $teamThread->pulse_id,
            'pulseName'      => $pulseName,
            'name'           => $this->teamMessage->user->name,

            // Include updated reactions so the client can render immediately
            'reactions'      => method_exists($this->teamMessage, 'groupedReactions')
                ? $this->teamMessage->groupedReactions()
                : [],
        ];
    }
}