<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Pulse;

use App\Support\Data;

final class PulseMemberData extends Data
{
    public function __construct(
        public readonly string $userId,
        public readonly string $role,
    ) {
    }
}
