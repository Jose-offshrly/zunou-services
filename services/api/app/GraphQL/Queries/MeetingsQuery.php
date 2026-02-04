<?php

namespace App\GraphQL\Queries;

use App\Models\Meeting;
use GraphQL\Error\Error;
use Illuminate\Support\Collection;

final readonly class MeetingsQuery
{
    public function __invoke($rootValue, array $args): Collection
    {
        $user = auth()->user();
        if (!$user) {
            throw new error('No user was found');
        }

        $query = Meeting::forPulse($args['pulseId'])->forUser($args['userId']);

        if (isset($args['added'])) {
            $query->whereStatus('added');
        }

        if (isset($args['ignored'])) {
            $query->whereStatus('ignored');
        }

        return $query->orderBy('date', 'desc')->get();
    }
}
