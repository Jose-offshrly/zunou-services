<?php

declare(strict_types=1);

namespace App\Actions\MeetingSession;

use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Models\EventInstance;
use App\Models\MeetingSession;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateMeetingSessionFromEventInstanceAction
{
    public function handle(EventInstance $eventInstance, ?User $user = null): MeetingSession
    {
        return DB::transaction(function () use ($eventInstance, $user) {
            $event = $eventInstance->event;

            if (! $event) {
                throw new \RuntimeException('EventInstance is missing related Event.');
            }

            if (! $user) {
                $user = Auth::user();
            }

            $generatedMeetingId = (string) Str::ulid();

            $startAtUtc = $event->getRawOriginal('start_at')
                ? Carbon::parse($event->getRawOriginal('start_at'))
                : null;
            $endAtUtc = $event->getRawOriginal('end_at')
                ? Carbon::parse($event->getRawOriginal('end_at'))
                : null;

            $meetingSession = MeetingSession::create([
                'meeting_id'           => strtolower($generatedMeetingId),
                'meeting_url'          => $event->link,
                'type'                 => MeetingSessionType::MEETING->value,
                'pulse_id'             => $eventInstance->pulse_id,
                'organization_id'      => $event->organization_id,
                'user_id'              => $event->user_id,
                'name'                 => $event->name,
                'description'          => $event->summary,
                'start_at'             => $startAtUtc,
                'end_at'               => $endAtUtc,
                'status'               => MeetingSessionStatus::INACTIVE->value,
                'event_id'             => $event->id,
                'event_instance_id'    => $eventInstance->id,
                'invite_pulse'         => false,
                'recurring_invite'     => false,
            ]);

            return $meetingSession->refresh();
        });
    }
}


