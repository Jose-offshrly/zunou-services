<?php

namespace App\GraphQL\Queries;

use App\Models\SavedMessage;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;

class ThreadSavedMessagesQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $query = SavedMessage::query();

        $query
            ->where('user_id', $args['userId'])
            ->when(
                isset($args['threadId']),
                fn ($query) => $query->where('thread_id', $args['threadId']),
            )
            ->orderBy('created_at', 'desc')
            ->get();

        $perPage = $args['perPage'] ?? 10;
        $page    = $args['page']    ?? 1;

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
