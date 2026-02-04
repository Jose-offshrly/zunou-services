<?php

namespace App\GraphQL\Mutations;

use App\Actions\TeamMessage\UpdateTeamMessageAction;
use App\DataTransferObjects\TeamMessageData;
use App\Models\TeamMessage;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class UpdateTeamMessageMutation
{
    public function __construct(
        private UpdateTeamMessageAction $updateTeamMessageAction
    ) {
    }

    public function __invoke($_, array $args): TeamMessage
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new Error('No user was found');
            }

            // Check if the user has permission to update this message
            $teamMessage = TeamMessage::findOrFail(
                $args['input']['teamMessageId']
            );
            if ($teamMessage->user_id !== $user->id) {
                throw new Error(
                    'You do not have permission to update this message'
                );
            }

            return $this->updateTeamMessage($args['input'], $teamMessage);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to update team message: ' . $e->getMessage()
            );
        }
    }

    private function updateTeamMessage(
        array $input,
        TeamMessage $teamMessage
    ): TeamMessage {
        $data = new TeamMessageData(
            team_thread_id: $teamMessage->team_thread_id,
            user_id: $teamMessage->user_id,
            content: $input['content'],
            reply_team_thread_id: $teamMessage->reply_team_thread_id,
            metadata: $teamMessage->metadata,
            files: $input['files'] ?? null
        );

        return $this->updateTeamMessageAction->handle($teamMessage->id, $data);
    }
}
