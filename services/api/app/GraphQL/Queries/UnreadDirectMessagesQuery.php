<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class UnreadDirectMessagesQuery
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ): Collection {
        $user = Auth::user();
        if (! $user) {
            return collect();
        }

        $senderIds = DirectMessage::whereHas('thread', function ($query) use (
            $user,
            $args
        ) {
            $query
                ->where('organization_id', $args['organizationId'])
                ->whereJsonContains('participants', $user->id);
        })
            ->where('sender_id', '!=', $user->id)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->distinct()
            ->pluck('sender_id');

        return User::whereIn('id', $senderIds)
            ->orderByDesc('created_at')
            ->get();
    }
}
