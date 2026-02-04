<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Support\Data;

final class ContactData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $email = null,
        public readonly ?string $telephone_number = null,
        public readonly ?string $alt_email = null,
        public readonly ?string $alt_telephone_number = null,
        /** @var array<string, mixed> */
        public readonly array $settings = [],
        public readonly ?string $details = null,
        public readonly ?string $user_id = null,
    ) {
    }
}
