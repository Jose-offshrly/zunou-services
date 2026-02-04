<?php

declare(strict_types=1);

namespace App\DataTransferObjects\MeetingSession;

final class UpdateMeetingSessionData
{
    public function __construct(public readonly string $status)
    {
    }
}
