<?php

namespace App\Events;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * @deprecated BROADCAST DEPRECATION: The Pusher channel broadcasting (ShouldBroadcast) in this class is
 * deprecated and will be removed in a future release. Real-time message delivery is now handled by the
 * Notification Hub Lambda service, which sends events via pusher.trigger() to private-users.{userId} channels.
 *
 * The dashboard frontend uses useHubChat (hooks/useHubChat.ts) to subscribe to Hub events (.team-message),
 * NOT Echo/Laravel channel subscriptions. These broadcasts go to channels that nothing listens to.
 *
 * For new real-time features, use the Notification Hub:
 * - Dashboard: services/dashboard/src/services/NotificationHubClient.ts
 * - Hub Lambda: services/lambda/notification-hub/
 * - Frontend subscription: services/dashboard/src/context/NotificationHubContext.tsx
 * - Frontend hook: services/dashboard/src/hooks/useHubChat.ts
 */
class ReplyTeamMessageSent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public TeamMessage $teamMessage;

    public function __construct(TeamMessage $teamMessage)
    {
        $this->teamMessage = $teamMessage;
    }

    public function broadcastOn(): PresenceChannel
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);

        return new PresenceChannel(
            'reply.team.thread.' .
                $teamThread->pulse_id .
                '.' .
                $this->teamMessage->reply_team_thread_id,
        );
    }

    public function broadcastAs(): string
    {
        return 'reply-team-message-sent';
    }

    public function broadcastWith(): array
    {
        $teamThread = TeamThread::find($this->teamMessage->team_thread_id);

        return [
            'name'              => $this->teamMessage->user->name,
            'userId'            => $this->teamMessage->user_id,
            'message'           => $this->teamMessage->content,
            'replyTeamThreadId' => $this->teamMessage->reply_team_thread_id,
            'repliedToMessageId' => $this->teamMessage->replied_to_message_id,
            'metadata'          => $this->teamMessage->metadata,
            'timestamp'         => now()->toIso8601String(),
        ];
    }
}
