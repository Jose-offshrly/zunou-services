<?php

namespace App\Observers;

use App\Concerns\FeedHandler;
use App\Enums\FeedType;
use App\Enums\MeetingSessionType;
use App\Events\MeetingSessionStatusUpdated;
use App\Models\MeetingSession;
use Illuminate\Support\Facades\Auth;

class MeetingSessionObserver
{
    use FeedHandler;

    public function created(MeetingSession $meetingSession): void
    {
        if ($meetingSession->type === MeetingSessionType::COLLAB) {
            foreach ($meetingSession->pulse->members as $member) {
                $this->recordActivity(
                    model: $meetingSession,
                    properties: [
                        'data'   => $meetingSession->toArray(),
                        'causer' => Auth::user()->only([
                            'id',
                            'name',
                            'email',
                            'gravatar',
                        ]),
                    ],
                    description: 'Started a collab on ' .
                        $meetingSession->pulse->name,
                    feed_type: FeedType::COLLAB_STARTED->value,
                    organization_id: $meetingSession->organization_id,
                    receiver_id: $member->user->id,
                    pulse_id: $meetingSession->pulse_id,
                );
            }
        }
    }

    /**
     * Handle the MeetingSession "updated" event.
     */
    public function updated(MeetingSession $meetingSession): void
    {
        event(new MeetingSessionStatusUpdated(meetingSession: $meetingSession));
    }
}
