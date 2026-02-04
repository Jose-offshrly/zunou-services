<?php

namespace App\GraphQL\Queries;

use App\Models\SavedMessage;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;

final readonly class SavedMessagesQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo
    ) {
        $query = SavedMessage::query();

        if (!empty($args['userId'])) {
            $query->forUser($args['userId']);
        }

        if (!empty($args['organizationId'])) {
            $query->whereHas('thread', function ($q) use ($args) {
                $q->where('organization_id', '=', $args['organizationId']);
            });
        }

        if (!empty($args['pulseId'])) {
            $query->whereHas('thread', function ($q) use ($args) {
                $q->where('pulse_id', '=', $args['pulseId']);
            });
        }

        $query->orderBy('created_at', 'desc')->get();

        $perPage = $args['perPage'] ?? 10;
        $page = $args['page'] ?? 1;

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
