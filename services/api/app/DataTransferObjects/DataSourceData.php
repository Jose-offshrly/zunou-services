<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Support\Data;

final class DataSourceData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $organization_id,
        public readonly string $type,
        public readonly string $description,
        public readonly string $file_key,
        public readonly string $file_name,
        public ?string $pulse_id = null,
    ) {
    }
}
