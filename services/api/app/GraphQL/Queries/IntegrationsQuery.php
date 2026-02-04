<?php

namespace App\GraphQL\Queries;

use App\Models\Integration;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

final readonly class IntegrationsQuery
{
    public function __invoke($rootValue, array $args): Collection
    {
        $user = auth()->user();
        if (! $user) {
            throw new error('No user was found');
        }

        $query = Integration::query()
            ->wherePulseId($args['pulseId'])
            ->whereUserId($args['userId']);

        return $query->get();
    }
}
