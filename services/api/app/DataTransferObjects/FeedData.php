<?php

namespace App\DataTransferObjects;

final readonly class FeedData
{
    public function __construct(
        public string $content,
        public string $user_id,
        public string $pulse_id,
        public string $organization_id,
    ) {
    }
}
