<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\MeetingSession\UpdateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\UpdateMeetingSessionData;
use App\Models\MeetingSession;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UpdateMeetingSessionMutation
{
    public function __construct(
        private readonly UpdateMeetingSessionAction $updateMeetingSessionAction,
    ) {
    }

    public function __invoke($rootValue, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new \Exception('User not authenticated');
            }

            // Log the args and user info for debugging
            Log::info('UpdateMeetingSessionMutation request:', [
                'user_id'                 => $user->id,
                'user_organization_id'    => $user->organizationId,
                'args'                    => $args,
                'raw_meeting_session_id'  => $args['input']['meetingSessionId'] ?? null,
                'meeting_session_id_type' => gettype(
                    $args['input']['meetingSessionId'] ?? null,
                ),
            ]);

            // Check if input exists in args
            if (! isset($args['input'])) {
                throw new \Exception(
                    'Input is required for updateMeetingSession mutation',
                );
            }

            $input = $args['input'];

            // Check if required fields exist in input
            if (
                ! isset($input['meetingSessionId']) || ! isset($input['status'])
            ) {
                throw new \Exception(
                    'meetingSessionId and status are required in the input',
                );
            }

            // Log the exact ID being used for the query
            Log::info('Attempting to find meeting session with ID:', [
                'meeting_session_id' => $input['meetingSessionId'],
                'id_length'          => strlen($input['meetingSessionId']),
                'id_format'          => preg_match(
                    '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                    $input['meetingSessionId'],
                )
                    ? 'valid_uuid'
                    : 'invalid_uuid',
            ]);

            $meetingSession = MeetingSession::findOrFail(
                $input['meetingSessionId'],
            );

            // Log meeting session details for debugging
            Log::info('Meeting session details:', [
                'meeting_session_id'              => $meetingSession->id,
                'meeting_session_organization_id' => $meetingSession->organizationId,
                'requested_status'                => $input['status'],
            ]);

            $data = new UpdateMeetingSessionData(status: $input['status']);

            $meetingSession = $this->updateMeetingSessionAction->handle(
                meetingSession: $meetingSession,
                data: $data,
            );

            // Return the enum value directly
            return [
                'id'     => $meetingSession->id,
                'status' => $meetingSession->status->value,
            ];
        } catch (\Exception $e) {
            Log::error(
                'Error in UpdateMeetingSessionMutation: ' . $e->getMessage(),
            );
            throw $e;
        }
    }
}
