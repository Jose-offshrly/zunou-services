<?php

namespace App\Actions\Collaboration;

use App\Actions\MeetingSession\UpdateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\UpdateMeetingSessionData;
use App\DataTransferObjects\UpdateCollaborationData;
use App\Enums\MeetingSessionStatus;
use App\Events\CollabEnded;
use App\Models\Collaboration;
use App\Models\MeetingSession;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

class UpdateCollaborationAction
{
    public function __construct(
        private readonly UpdateMeetingSessionAction $updateMeetingSessionAction,
    ) {
    }

    public function handle(
        Collaboration $collaboration,
        UpdateCollaborationData $data,
    ): Collaboration {
        $collaboration->update([
            'status' => strtoupper($data->status),
        ]);

        $meetingSession = MeetingSession::where(
            'meeting_url',
            '=',
            $collaboration->meeting_link,
        )->first();

        if (! $meetingSession) {
            Log::error('No meeting session found for collaboration', [
                'collaboration_id' => $collaboration->id,
                'meeting_link'     => $collaboration->meeting_link,
                'status'           => $data->status,
            ]);
            throw new Error('No meeting session found for collaboration');
        }

        $data = new UpdateMeetingSessionData(
            status: MeetingSessionStatus::STOPPED->value,
        );

        $this->updateMeetingSessionAction->handle(
            meetingSession: $meetingSession,
            data: $data,
        );

        User::whereIn('id', $collaboration->attendees->pluck('id'))
            ->get()
            ->each(
                fn ($user) => broadcast(new CollabEnded($meetingSession, $user)),
            );

        return $collaboration->refresh();
    }
}
