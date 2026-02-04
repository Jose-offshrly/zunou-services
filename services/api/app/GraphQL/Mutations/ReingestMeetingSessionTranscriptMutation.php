<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\MeetingSession\ReingestMeetingSessionTranscriptAction;
use App\Models\Meeting;
use App\Models\MeetingSession;
use App\Models\Pulse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class ReingestMeetingSessionTranscriptMutation
{
    public function __construct(
        private ReingestMeetingSessionTranscriptAction $action,
    ) {
    }

    /**
     * @param  array{input: array{meetingSessionId: string, targetPulseId: string}}  $args
     */
    public function __invoke(null $_, array $args): Meeting
    {
        $user = Auth::user();
        if (! $user) {
            throw new \Exception('No user was found');
        }

        if (! isset($args['input']['meetingSessionId'], $args['input']['targetPulseId'])) {
            throw new \InvalidArgumentException('meetingSessionId and targetPulseId are required');
        }

        $meetingSession = MeetingSession::findOrFail($args['input']['meetingSessionId']);
        $targetPulse    = Pulse::findOrFail($args['input']['targetPulseId']);

        // Optional org guard: ensure user and resources belong to same org
        if ($meetingSession->organization_id !== $targetPulse->organization_id) {
            Log::warning('Reingest mutation org mismatch', [
                'meeting_session_org' => $meetingSession->organization_id,
                'target_pulse_org'    => $targetPulse->organization_id,
            ]);
            throw new \Exception('Meeting session and target pulse must belong to the same organization');
        }

        return $this->action->handle(
            meetingSession: $meetingSession,
            targetPulse: $targetPulse,
        );
    }
}


