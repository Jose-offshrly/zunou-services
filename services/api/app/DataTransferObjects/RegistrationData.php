<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final readonly class RegistrationData
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {
    }
}
