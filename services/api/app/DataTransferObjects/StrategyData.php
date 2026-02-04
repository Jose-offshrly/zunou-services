<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Support\Data;

final class StrategyData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $type,
        public readonly string $description,
        public readonly string $freeText,
        public readonly string $organizationId,
        public ?string $prompt_description = null,
        public ?string $pulseId = null,
    ) {
    }
}
