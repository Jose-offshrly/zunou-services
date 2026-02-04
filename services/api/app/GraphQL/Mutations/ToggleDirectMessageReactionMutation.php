<?php declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\DirectMessage;
use App\Models\DirectMessageReaction;

use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class ToggleDirectMessageReactionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): bool
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new Error('No user was found');
            }

            $directMessage = DirectMessage::findOrFail(
                $args['directMessageId']
            );
            $reaction = $args['reaction'];

            $existingReaction = $directMessage
                ->reactions()
                ->where('user_id', $user->id)
                ->where('reaction', $reaction)
                ->first();
            if ($existingReaction) {
                $directMessage->removeReaction($user, $reaction);
            } else {
                $directMessage->addReaction($user, $reaction);
            }

            return true;
        } catch (\Exception $e) {
            throw new Error('Failed to toggle reaction: ' . $e->getMessage());
        }
    }
}
