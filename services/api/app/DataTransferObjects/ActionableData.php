<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Support\Data;

final class ActionableData extends Data
{
    public function __construct(
        public readonly string $description,
        public readonly string $pulse_id,
        public readonly string $organization_id,
        public readonly ?string $data_source_id = null,
        public readonly ?string $event_id = null,
        public readonly ?string $task_id = null,
        public readonly ?string $status = null,
    ) {
    }
}
