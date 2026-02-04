<?php

namespace App\DataTransferObjects;

use App\Enums\MeetingType;
use Illuminate\Support\Carbon;

class EventData
{
    public function __construct(
        public readonly string $name,
        public readonly string $description,
        public readonly Carbon $start_at,
        public readonly Carbon $end_at,
        public readonly array $attendees,
        public readonly ?array $external_attendees = null,
        public readonly ?MeetingType $meeting_type = null,
    ) {
    }
}
