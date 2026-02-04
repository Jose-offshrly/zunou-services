<?php

namespace App\DataTransferObjects;

final readonly class TeamThreadData
{
    public function __construct(
        public string $pulse_id,
        public string $organization_id,
    ) {
    }
}
