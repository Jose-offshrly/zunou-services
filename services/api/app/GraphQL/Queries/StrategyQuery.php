<?php

namespace App\GraphQL\Queries;

use App\Models\Strategy;
use GraphQL\Error\Error;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;

final readonly class StrategyQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo
    ): Collection {
        $user = Auth::user();
        if (!$user) {
            throw new error('No user was found');
        }

        $query = Strategy::query()
            ->forPulse($args['pulseId'])
            ->whereIn('organization_id', $user->organizationIds())
            ->get();

        return $query->groupBy('type');
    }
}
