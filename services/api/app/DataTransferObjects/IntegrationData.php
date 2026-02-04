<?php

namespace App\DataTransferObjects;

final readonly class IntegrationData
{
    public function __construct(
        public string $user_id,
        public string $pulse_id,
        public string $type,
        public string $api_key,
        public ?string $secret_key = null,
    ) {
    }
}
