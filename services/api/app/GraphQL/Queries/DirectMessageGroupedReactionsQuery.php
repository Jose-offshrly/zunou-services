<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessage;

final readonly class DirectMessageGroupedReactionsQuery
{
    /** @param  array{}  $args */
    public function __invoke(DirectMessage $directMessage): array
    {
        return $directMessage->getGroupedReactions();
    }
}
