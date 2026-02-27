<?php

namespace App\GraphQL\Mutations;

use App\Enums\MeetingSessionStatus;
use App\Models\EventInstance;
use App\Models\MeetingSession;
use App\Models\RecurringEventInstanceSetup;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class UpdateMeetingSessionInvitePulseMutation
{
    public function __invoke(
        $rootValue,
        array $args,
        GraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $input          = $args['input'];
        $meetingSession = MeetingSession::findOrFail(
            $input['meetingSessionId'],
        );

        $uninviteAll = !empty($input['uninvite_all']);
        $reinviteAll = !empty($input['reinvite_all']);

        if ($uninviteAll && $reinviteAll) {
            throw new \InvalidArgumentException('Cannot set both uninvite_all and reinvite_all');
        }

        $updateData = ['invite_pulse' => $input['invite_pulse']];

        if (isset($input['recurring_invite'])) {
            $updateData['recurring_invite'] = $input['recurring_invite'];
        }

        if ($uninviteAll || $reinviteAll) {
            $updateData['status'] = MeetingSessionStatus::INACTIVE;

            DB::transaction(function () use ($meetingSession, $updateData, $reinviteAll) {
                $meetingSession->update($updateData);

                if ($meetingSession->event_instance_id) {
                    $this->applySeriesInviteState($meetingSession, $reinviteAll);
                }
            });
        } else {
            $meetingSession->update($updateData);
        }

        return $meetingSession->refresh();
    }

    private function applySeriesInviteState(MeetingSession $meetingSession, bool $invite): void
    {
        $eventInstance = EventInstance::with('event')
            ->find($meetingSession->event_instance_id);

        if (! $eventInstance) {
            Log::warning('Skipping series invite: EventInstance not found', [
                'meeting_session_id'  => $meetingSession->id,
                'event_instance_id'   => $meetingSession->event_instance_id,
            ]);

            return;
        }

        if (! $eventInstance->event || ! $eventInstance->event->recurring_event_id) {
            Log::debug('Skipping series invite: not a recurring event', [
                'meeting_session_id' => $meetingSession->id,
                'event_instance_id'  => $meetingSession->event_instance_id,
            ]);

            return;
        }

        $recurringEventId = $eventInstance->event->recurring_event_id;
        $pulseId          = $meetingSession->pulse_id;

        if (! $pulseId) {
            Log::debug('Skipping series invite: no pulse_id', [
                'meeting_session_id' => $meetingSession->id,
            ]);

            return;
        }

        $cutoffTime = now();
        $batchSize  = 1000;

        DB::transaction(function () use ($recurringEventId, $pulseId, $invite, $cutoffTime, $batchSize) {
            $meetingSessionsUpdated = 0;

            MeetingSession::where('pulse_id', $pulseId)
                ->where('start_at', '>', $cutoffTime)
                ->whereIn('event_instance_id', function ($query) use ($pulseId, $recurringEventId) {
                    $query->select('event_instances.id')
                        ->from('event_instances')
                        ->join('events', 'events.id', '=', 'event_instances.event_id')
                        ->where('event_instances.pulse_id', $pulseId)
                        ->where('events.recurring_event_id', $recurringEventId);
                })
                ->chunkById($batchSize, function ($sessions) use ($invite, &$meetingSessionsUpdated) {
                    $count = MeetingSession::whereIn('id', $sessions->pluck('id'))
                        ->update([
                            'invite_pulse' => $invite,
                            'status'       => MeetingSessionStatus::INACTIVE,
                        ]);
                    $meetingSessionsUpdated += $count;
                });

            $setupsUpdated = RecurringEventInstanceSetup::where('recurring_event_id', $recurringEventId)
                ->where('pulse_id', $pulseId)
                ->update(['invite_notetaker' => $invite]);

            Log::info('Applied series invite state', [
                'recurring_event_id'       => $recurringEventId,
                'pulse_id'                 => $pulseId,
                'invite'                   => $invite,
                'meeting_sessions_updated' => $meetingSessionsUpdated,
                'recurring_setups_updated' => $setupsUpdated,
            ]);
        });
    }
}
