<?php

namespace App\DataTransferObjects;

final readonly class ReplyTeamThreadData
{
    public function __construct(
        public string $team_thread_id,
        public string $user_id,
        public string $content,
        public ?string $topic_id = null,
        public ?array $metadata = null
    ) {
    }
}
