<?php

namespace App\GraphQL\Mutations;

use App\Models\EventInstance;
use App\Models\MeetingSession;
use App\Models\RecurringEventInstanceSetup;
use GraphQL\Type\Definition\ResolveInfo;
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

        $meetingSession->update([
            'invite_pulse' => $input['invite_pulse'],
        ]);

        if (isset($input['recurring_invite'])) {
            $meetingSession->update([
                'recurring_invite' => $input['recurring_invite'],
            ]);
        }

        if ((!empty($input['uninvite_all']) || !empty($input['reinvite_all'])) && $meetingSession->event_instance_id) {
            $invite = !empty($input['reinvite_all']);
            $this->applySeriesInviteState($meetingSession, $invite);
        }

        return $meetingSession->refresh();
    }

    private function applySeriesInviteState(MeetingSession $meetingSession, bool $invite): void
    {
        $eventInstance = EventInstance::with('event.recurringEvent')
            ->find($meetingSession->event_instance_id);

        if (! $eventInstance || ! $eventInstance->event || ! $eventInstance->event->recurring_event_id) {
            return;
        }

        $recurringEventId = $eventInstance->event->recurring_event_id;
        $pulseId          = $meetingSession->pulse_id;

        $seriesInstanceIds = EventInstance::where('pulse_id', $pulseId)
            ->whereHas('event', fn ($q) => $q->where('recurring_event_id', $recurringEventId))
            ->pluck('id');

        MeetingSession::where('pulse_id', $pulseId)
            ->whereIn('event_instance_id', $seriesInstanceIds)
            ->update(['invite_pulse' => $invite]);

        RecurringEventInstanceSetup::where('recurring_event_id', $recurringEventId)
            ->where('pulse_id', $pulseId)
            ->update(['invite_notetaker' => $invite]);
    }
}
