<?php

namespace App\DataTransferObjects;

final readonly class FireFliesUserData
{
    public function __construct(
        public string $user_id,
        public string $name,
        public string $email,
    ) {
    }
}
