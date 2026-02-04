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

class DirectMessageDeleted implements ShouldBroadcast
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
        return 'direct-message-deleted';
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
            'threadId'        => $thread->id,
            'organizationId'  => $thread->organization_id,
            'directMessageId' => $this->directMessage->id,
            'timestamp'       => now()->toIso8601String(),
        ];
    }
}
