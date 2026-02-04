<?php

namespace App\GraphQL\Mutations;

use App\Models\LiveInsightOutbox;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Support\Contracts\GraphQLContext;

class BookmarkInsightMutation
{
    /**
     * Toggle bookmark status for an insight.
     */
    public function __invoke(
        $rootValue,
        array $args,
        GraphQLContext $context,
        ResolveInfo $resolveInfo
    ): LiveInsightOutbox {
        $insightId = $args['id'];
        $userId = auth()->id();

        // Find the insight and ensure it belongs to the authenticated user
        $insight = LiveInsightOutbox::query()
            ->where('id', $insightId)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Toggle bookmark status
        $isCurrentlyBookmarked = $insight->is_bookmarked;

        $insight->update([
            'is_bookmarked' => !$isCurrentlyBookmarked,
            'bookmarked_at' => !$isCurrentlyBookmarked ? now() : null,
        ]);

        return $insight->fresh();
    }
}
