<?php

namespace App\GraphQL\Queries;

use App\Models\LiveInsightOutbox;
use Illuminate\Support\Collection;

class LiveInsightRecommendationsQuery
{
    public function __invoke($_, array $args): Collection
    {
        $query = LiveInsightOutbox::findOrFail($args['id']);
        return $query->recommendations;
    }
}