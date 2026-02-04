<?php

declare(strict_types=1);

namespace App\DataTransferObjects\MeetingSession;

use App\Enums\MeetingType;
use Illuminate\Support\Carbon;

final class MeetingSessionData
{
    public function __construct(
        public readonly string $meeting_id,
        public readonly ?string $meeting_url,
        public readonly string $type,
        public readonly string $pulse_id,
        public readonly string $organization_id,
        public readonly string $user_id,
        public readonly ?string $name,
        public readonly ?string $description,
        public readonly ?Carbon $start_at,
        public readonly ?Carbon $end_at,
        public readonly ?array $attendees = null,
        public readonly ?array $external_attendees = null,
        public readonly bool $invite_pulse = false,
        public readonly ?string $gcal_meeting_id = null,
        public readonly ?string $status = null,
        public readonly ?string $event_id = null,
        public readonly ?string $event_instance_id = null,
        public readonly ?string $recurring_meeting_id = null,
        public readonly ?bool $recurring_invite = null,
        public readonly ?string $passcode = null,
        public readonly ?MeetingType $meeting_type = null,
    ) {
    }
}
