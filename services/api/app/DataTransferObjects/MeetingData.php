<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

use App\Models\DataSource;
use App\Models\Pulse;
use Illuminate\Support\Carbon;

final class MeetingData
{
    public function __construct(
        public readonly string $title,
        public readonly string $pulse_id,
        public readonly string $user_id,
        public readonly Carbon $date,
        public readonly string $organizer,
        public ?string $transcript = null,
        public readonly ?string $participants = null,
        public readonly ?FileData $fileData = null,
        public readonly ?string $source = 'manual',
        public readonly ?DataSource $dataSource = null,
        public readonly ?Pulse $pulse = null,
        public readonly ?string $meeting_session_id = null,
    ) {
    }
}
