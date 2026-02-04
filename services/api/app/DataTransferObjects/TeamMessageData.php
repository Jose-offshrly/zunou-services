<?php

namespace App\DataTransferObjects;

final readonly class TeamMessageData
{
    public function __construct(
        public string $team_thread_id,
        public string $user_id,
        public string $content,
        public ?string $reply_team_thread_id = null,
        public ?string $topic_id = null,
        public ?string $replied_to_message_id = null,
        public ?array $metadata = null,
        public ?array $files = null
    ) {
    }
}
