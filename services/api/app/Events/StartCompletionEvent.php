<?php

namespace App\Events;

use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StartCompletionEvent
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public string $organizationId,
        public Thread $thread,
        public User $user,
        public Message $message,
    ) {
    }
}
