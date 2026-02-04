<?php

namespace App\DataTransferObjects;

final readonly class TranscriptData
{
    public function __construct(
        public string $content,
        public string $meeting_id,
        public string $data_source_id,
    ) {
    }
}
