<?php

namespace App\GraphQL\Mutations;

use App\Models\MeetingSession;
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

        return $meetingSession;
    }
}
