<?php

namespace App\DataTransferObjects;

use App\Support\Data;

final class RecurringEventInstanceSetupData extends Data
{
    public function __construct(
        public readonly string $recurring_event_id,
        public readonly string $pulse_id,
        public readonly bool $invite_notetaker,
        public readonly ?array $setting = null,
    ) {}
}
