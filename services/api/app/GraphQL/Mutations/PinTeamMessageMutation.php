<?php declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TeamMessage;
final readonly class PinTeamMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $teamMessage = TeamMessage::findOrFail($args['teamMessageId']);
        $teamMessage->update(['is_pinned' => $args['pinned']]);
        return $teamMessage;
    }
}
