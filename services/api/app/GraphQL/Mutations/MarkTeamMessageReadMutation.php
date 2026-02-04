<?php

namespace App\GraphQL\Mutations;

use App\Models\TeamMessage;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class MarkTeamMessageReadMutation
{
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
            $teamMessage->markAsRead($user);

            return true;
        } catch (\Exception $e) {
            throw new Error(
                'Failed to mark message as read: ' . $e->getMessage(),
            );
        }
    }
}
