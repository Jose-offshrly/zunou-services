<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final class PulseMemberData
{
    public function __construct(
        public readonly string $job_description,
        /** @var string[] */
        public readonly array $responsibilities,
    ) {
    }
}
