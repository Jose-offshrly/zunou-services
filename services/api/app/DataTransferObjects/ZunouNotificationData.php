<?php

namespace App\DataTransferObjects;

final readonly class ZunouNotificationData
{
    public function __construct(
        public string $description,
        public string $kind,
        public string $organization_id,
        public ?array $metadata = [],
        public ?string $pulse_id = null,
        public ?string $summary_id = null,
    ) {
    }
}
