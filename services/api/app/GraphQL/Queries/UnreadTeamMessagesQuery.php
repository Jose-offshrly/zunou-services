<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Pulse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class UnreadTeamMessagesQuery
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

        return Pulse::where('organization_id', $args['organizationId'])
            ->whereHas('members', function ($query) use ($user, $args) {
                $query->where('pulse_members.user_id', $user->id);
            })
            ->whereHas('team_thread.teamMessages', function ($query) use (
                $user
            ) {
                $query
                    ->whereNotNull('team_messages.team_thread_id')
                    ->whereDoesntHave('reads', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    });
            })
            ->with([
                'notifications',
                'team_thread.teamMessages' => function ($query) use ($user) {
                    $query
                        ->whereNotNull('team_messages.team_thread_id')
                        ->whereDoesntHave('reads', function ($query) use (
                            $user
                        ) {
                            $query->where('user_id', $user->id);
                        })
                        ->with(['files', 'reactions.user', 'reads']);
                },
            ])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
