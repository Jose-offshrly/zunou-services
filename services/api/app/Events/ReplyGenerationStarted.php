<?php

namespace App\Events;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
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
 * The dashboard frontend uses useHubChat (hooks/useHubChat.ts) to subscribe to Hub events,
 * NOT Echo/Laravel channel subscriptions. These broadcasts go to channels that nothing listens to.
 *
 * For new real-time features, use the Notification Hub:
 * - Dashboard: services/dashboard/src/services/NotificationHubClient.ts
 * - Hub Lambda: services/lambda/notification-hub/
 * - Frontend subscription: services/dashboard/src/context/NotificationHubContext.tsx
 * - Frontend hook: services/dashboard/src/hooks/useHubChat.ts
 */
class ReplyGenerationStarted implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public TeamMessage $message, public User $user)
    {
    }

    public function broadcastOn(): PresenceChannel
    {
        $teamThread = TeamThread::find($this->message->team_thread_id);

        return new PresenceChannel(
            'reply.team.thread.' .
                $teamThread->pulse_id .
                '.' .
                $this->message->reply_team_thread_id,
        );
    }

    public function broadcastAs(): string
    {
        return 'ai-reply-generation-started';
    }

    public function broadcastWith(): array
    {
        return [
            'userId'            => $this->message->user_id,
            'message'           => $this->message->content,
            'replyTeamThreadId' => $this->message->reply_team_thread_id,
            'metadata'          => $this->message->metadata,
        ];
    }
}
