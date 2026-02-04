<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\User;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class UserQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $query = User::query();

        if (isset($args['name'])) {
            $query->where('users.name', 'ILIKE', $args['name']);
        }

        if (isset($args['userId'])) {
            $query->where('users.id', 'ILIKE', $args['userId']);
        }

        if (isset($args['slackId'])) {
            $query->where('users.slack_id', 'ILIKE', $args['slackId']);
        }

        if (isset($args['organizationId'])) {
            $query
                ->join(
                    'organization_users',
                    'users.id',
                    '=',
                    'organization_users.user_id',
                )
                ->where(
                    'organization_users.organization_id',
                    '=',
                    $args['organizationId'],
                )
                ->select('users.*');
        }

        return $query->first();
    }
}
