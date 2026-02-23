<?php

namespace App\DataTransferObjects;

use App\Support\Data;

final class RecurringEventData extends Data
{
    public function __construct(
        public readonly string $google_parent_id,
    ) {}
}
