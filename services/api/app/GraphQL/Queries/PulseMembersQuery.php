<?php

namespace App\GraphQL\Queries;

use App\Models\PulseMember;
use GraphQL\Type\Definition\ResolveInfo;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;

final readonly class PulseMembersQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ) {
        $pulseId = $args['pulseId'];

        $query = PulseMember::query()
            ->wherePulseId($pulseId)
            ->with(['pulse.members.user', 'user', 'organizationUser'])
            ->join('users', 'pulse_members.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->select('pulse_members.*');

        $perPage = $args['perPage'] ?? 50;
        $page    = $args['page']    ?? 1;

        $result = $query->paginate($perPage, ['*'], 'page', $page);

        PulseMember::preloadOneToOnePulses($result->getCollection());

        return $result;
    }
}
