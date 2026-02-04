<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final class BackgroundData
{
    public function __construct(
        public readonly FileData $file,
        public readonly bool $active,
        public readonly string $user_id,
        public readonly string $organization_id,
    ) {
    }
}
