<?php declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Events\TeamMessageReacted;
use App\Models\TeamMessage;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class ToggleTeamMessageReactionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): bool
    {
        try {
            $user = Auth::user();
            if (!$user) {
                throw new Error('No user was found');
            }

            $teamMessage = TeamMessage::findOrFail($args['teamMessageId']);
            $reaction = $args['reaction'];

            $existingReaction = $teamMessage
                ->reactions()
                ->where('user_id', $user->id)
                ->where('reaction', $reaction)
                ->first();
            if ($existingReaction) {
                $teamMessage->removeReaction($user, $reaction);
            } else {
                $teamMessage->addReaction($user, $reaction);
            }

            TeamMessageReacted::dispatch($teamMessage);
            return true;
        } catch (\Exception $e) {
            throw new Error('Failed to toggle reaction: ' . $e->getMessage());
        }
    }
}
