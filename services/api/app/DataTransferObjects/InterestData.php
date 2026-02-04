<?php

namespace App\DataTransferObjects;

use App\Support\Data;

class InterestData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $company_name,
        public readonly string $company_size,
        public readonly ?string $looking_for = null,
    ) {
    }
}
