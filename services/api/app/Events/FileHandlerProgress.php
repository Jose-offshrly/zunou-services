<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FileHandlerProgress implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public string $status,
        public string $processType, // e.g., 'spreadsheet', 'document', 'image', etc.,
        public string $threadId,
        public ?array $data = null,
    ) {
    }

    public function broadcastOn(): array
    {
        return ['file-handler.' . $this->threadId];
    }

    public function broadcastAs(): string
    {
        return 'file-progress';
    }
}
