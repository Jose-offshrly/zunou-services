<?php

namespace App\DataTransferObjects;

use App\Support\Attributes\MapTo;

/**
 * @deprecated Part of deprecated DirectMessage system. Use TeamMessageData instead.
 */
class DirectMessageData
{
    public function __construct(
        public string $direct_message_thread_id,
        public string $sender_id,
        /** @var FileData[]|null $files */
        #[MapTo(FileData::class)] public ?array $files = null,
        public ?string $replied_to_message_id = null,
        public ?string $content = null
    ) {
    }
}
