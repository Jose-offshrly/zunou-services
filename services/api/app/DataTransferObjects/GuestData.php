<?php

namespace App\DataTransferObjects;

final readonly class GuestData
{
    public function __construct(
        public string $email,
        public string $role,
        public string $organizationId,
        public string $pulseId,
    ) {
    }
}
