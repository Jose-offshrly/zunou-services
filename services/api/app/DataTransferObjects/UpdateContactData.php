<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final class UpdateContactData
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly ?string $alt_email = null,
        public readonly ?string $telephone_number = null,
        public readonly ?string $alt_telephone_number = null,
        /** @var array<string, mixed>|null */
        public readonly ?array $settings = null,
        public readonly ?string $details = null,
    ) {
    }
}


