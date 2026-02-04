<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\PulseMember;

final readonly class UpdatePulseLastVisitedMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $pulseMember = PulseMember::forPulse($args['pulseId'])
            ->forUser($args['userId'])
            ->first();

        $pulseMember->last_visited = $args['lastVisited'] ?? now();
        $pulseMember->save();

        return $pulseMember;
    }
}
