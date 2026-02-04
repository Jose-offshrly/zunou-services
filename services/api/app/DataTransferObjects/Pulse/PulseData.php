<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Pulse;

use App\Support\Data;

final class PulseData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $organizationId,
        public readonly ?string $icon = null,
        public ?string $masterPulseId = null,
        public ?string $description = null,
        public readonly ?string $category = null,
        public ?string $userId = null,
    ) {
    }
}
