<?php

namespace App\GraphQL\Queries;

use App\Models\Timesheet;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;

class UserTimesheetsQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $query = Timesheet::query();

        $query
            ->where('user_id', $args['userId'])
            ->orderBy('created_at', 'desc')
            ->get();

        $perPage = $args['perPage'] ?? 10;
        $page    = $args['page']    ?? 1;

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
