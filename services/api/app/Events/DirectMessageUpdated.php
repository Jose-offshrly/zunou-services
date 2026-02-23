<?php

namespace App\Events;

use App\Models\DirectMessage;
use App\Models\DirectMessageThread;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * @deprecated Part of deprecated DirectMessage system. Use TeamMessageUpdated with ONETOONE pulse category instead.
 *
 * BROADCAST DEPRECATION: The Pusher channel broadcasting (ShouldBroadcast) in this class is also
 * deprecated and will be removed in a future release. Real-time message delivery is now handled by the
 * Notification Hub Lambda service, which sends events via pusher.trigger() to private-users.{userId} channels.
 *
 * The dashboard frontend uses useHubChat (hooks/useHubChat.ts) to subscribe to Hub events (.dm-updated),
 * NOT Echo/Laravel channel subscriptions. These broadcasts go to channels that nothing listens to.
 *
 * Pusher Beams push notifications were also removed from this event (Feb 2026) for the same reason —
 * push notifications are now sent by the Notification Hub Lambda, not by Laravel event broadcasting.
 *
 * For new real-time features, use the Notification Hub:
 * - Dashboard: services/dashboard/src/services/NotificationHubClient.ts
 * - Hub Lambda: services/lambda/notification-hub/
 * - Frontend subscription: services/dashboard/src/context/NotificationHubContext.tsx
 * - Frontend hook: services/dashboard/src/hooks/useHubChat.ts
 */
class DirectMessageUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public DirectMessage $directMessage;

    public function __construct(DirectMessage $directMessage)
    {
        $this->directMessage = $directMessage;
    }

    public function broadcastOn(): array
    {
        $thread = DirectMessageThread::find(
            $this->directMessage->direct_message_thread_id,
        );
        $participantsIds = $thread->participants;

        $channels = [new PresenceChannel('direct.thread.' . $thread->id)];
        foreach ($participantsIds as $participantId) {
            $channels[] = new Channel('direct-messages.' . $participantId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'direct-message-updated';
    }

    public function broadcastWith(): array
    {
        $thread = DirectMessageThread::find(
            $this->directMessage->direct_message_thread_id,
        );

        $participants = $thread->participants;
        $receiverId   = collect($participants)->firstWhere(
            fn ($id) => $id !== $this->directMessage->sender_id,
        );

        return [
            'senderName'      => $this->directMessage->sender->name,
            'senderId'        => $this->directMessage->sender_id,
            'receiverId'      => $receiverId,
            'message'         => $this->directMessage->content,
            'threadId'        => $thread->id,
            'organizationId'  => $thread->organization_id,
            'directMessageId' => $this->directMessage->id,
            'timestamp'       => now()->toIso8601String(),
        ];
    }
}
