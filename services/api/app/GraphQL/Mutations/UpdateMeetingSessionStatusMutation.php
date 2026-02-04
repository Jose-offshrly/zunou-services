<?php

namespace App\GraphQL\Mutations;

use App\Models\MeetingSession;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UpdateMeetingSessionMutation
{
    public function __invoke($rootValue, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new \Exception('User not authenticated');
            }

            $meetingSession = MeetingSession::findOrFail($args['id']);

            // Check if the user has permission to update this meeting session
            if ($meetingSession->organization_id !== $user->organization_id) {
                throw new \Exception(
                    sprintf(
                        'User (org: %s) does not have permission to update meeting session (org: %s)',
                        $user->organization_id,
                        $meetingSession->organization_id,
                    ),
                );
            }

            // Update the meeting session status
            $meetingSession->status = $args['status'];
            $meetingSession->save();

            return [
                'id'     => $meetingSession->id,
                'status' => $meetingSession->status,
            ];
        } catch (\Exception $e) {
            Log::error(
                'Error in UpdateMeetingSessionMutation: ' . $e->getMessage(),
            );
            throw $e;
        }
    }
}
