<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;

final readonly class TeamMessageGroupedReactionsQuery
{
    /** @param  array{}  $args */
    public function __invoke(TeamMessage $teamMessage): array
    {
        return $teamMessage->getGroupedReactions();
    }
}
