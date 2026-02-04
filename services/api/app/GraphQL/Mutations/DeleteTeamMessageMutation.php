<?php

namespace App\GraphQL\Mutations;

use App\Actions\TeamMessage\DeleteTeamMessageAction;
use App\Models\TeamMessage;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class DeleteTeamMessageMutation
{
    public function __construct(
        private DeleteTeamMessageAction $deleteTeamMessageAction,
    ) {
    }

    public function __invoke($_, array $args): bool
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $teamMessage = TeamMessage::findOrFail(
                $args['input']['teamMessageId'],
            );

            // Check if the user is the owner of the message
            if ($teamMessage->user_id !== $user->id) {
                throw new Error(
                    'You do not have permission to delete this message',
                );
            }

            return $this->deleteTeamMessageAction->handle($teamMessage);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to delete the team message: ' . $e->getMessage(),
            );
        }
    }
}
