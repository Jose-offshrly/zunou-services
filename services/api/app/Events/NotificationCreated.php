<?php

namespace App\Events;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class NotificationCreated implements ShouldBroadcast
{
    public function __construct(
        public Notification $notification,
        public User $user
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel("users.{$this->user->id}");
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->notification->id,
            'description' => $this->notification->description,
            'kind'        => $this->notification->kind,
            'created_at'  => $this->notification->created_at,
        ];
    }
}
