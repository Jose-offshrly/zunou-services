<?php

namespace App\DataTransferObjects;

final readonly class SentenceData
{
    public function __construct(
        public int $index,
        public string $speaker,
        public string $raw_text,
        public string $text,
    ) {
    }
}
