<?php

declare(strict_types=1);

namespace App\Actions\MeetingSession;

use App\Concerns\CompanionHandler;
use App\DataTransferObjects\MeetingSession\UpdateMeetingSessionData;
use App\Models\MeetingSession;
use Illuminate\Support\Facades\DB;

class UpdateMeetingSessionAction
{
    use CompanionHandler;

    public function handle(
        MeetingSession $meetingSession,
        UpdateMeetingSessionData $data,
    ): MeetingSession {
        return DB::transaction(function () use ($meetingSession, $data) {
            return match ($data->status) {
                'START' => $this->startMeetingSession(
                    meetingSession: $meetingSession,
                ),
                'PAUSED' => $this->pauseMeetingSession(
                    meetingSession: $meetingSession,
                ),
                'ACTIVE' => $this->resumeMeetingSession(
                    meetingSession: $meetingSession,
                ),
                'STOPPED' => $this->endMeetingSession(
                    meetingSession: $meetingSession,
                ),
            };
        });
    }
}
