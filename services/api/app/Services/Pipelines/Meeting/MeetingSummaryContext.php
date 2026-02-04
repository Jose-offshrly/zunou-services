<?php

declare(strict_types=1);

namespace App\Services\Pipelines\Meeting;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use App\Support\Data;
use Illuminate\Support\Collection;

final class MeetingSummaryContext extends Data
{
    public function __construct(
        public readonly Collection $messages,
        public readonly Thread $thread,
        public readonly User $user,
        public readonly string $message,
        public readonly string $organization_id,
        public readonly string $pulse_id,
        public bool $success = true,
        public string $error = '',
        public mixed $result = null,
        public ?Pulse $pulse = null,
        public ?array $meeting_info = null,
    ) {
    }
}

