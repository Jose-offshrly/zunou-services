<?php

namespace App\DataTransferObjects\Calendar;

use App\Support\Data;

final class EventInstanceData extends Data
{
    public function __construct(
        public readonly string $event_id,
        public readonly string $pulse_id,
        public readonly ?string $local_description = null,
        public readonly ?string $priority = null,
        public readonly bool $is_recurring = false,
    ) {
    }
}
