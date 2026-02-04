<?php

namespace App\GraphQL\Queries;

use App\Models\MonthlyTrendingTopic;
use App\Services\CacheService;

class TrendingTopicsQuery
{
    public function __invoke($root, array $args)
    {
        // Cache trending topics for 10 minutes as this data changes infrequently
        return CacheService::cacheQuery(
            'trending_topics',
            [
                'org' => $args['organizationId'],
                'pulse' => $args['pulseId'],
                'month' => $args['month'],
                'year' => $args['year'],
            ],
            CacheService::TTL_LONG,
            function () use ($args) {
                return MonthlyTrendingTopic::where(
                    'organization_id',
                    $args['organizationId'],
                )
                    ->where('pulse_id', $args['pulseId'])
                    ->where('month', $args['month'])
                    ->where('year', $args['year'])
                    ->orderBy('rank', 'asc')
                    ->limit(10)
                    ->get(['title']);
            }
        );
    }
}
