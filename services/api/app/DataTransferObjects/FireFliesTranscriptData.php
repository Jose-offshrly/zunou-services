<?php

namespace App\DataTransferObjects;

final readonly class FireFliesTranscriptData
{
    public function __construct(
        public string $id,
        public string $title,
        public string $organizer,
        public string $date,
        public ?string $duration,
        public ?string $meeting_link,
        public ?string $transcript_url,
        public ?array $participants = [],
        /** @var SentenceData[]*/
        public ?array $sentences = [],
        public ?array $speakers = [],
    ) {
    }
}
