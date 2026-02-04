<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;

final readonly class PinnedTeamMessagesQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;

        $teamMessages = TeamMessage::where('is_pinned', true)
            ->where('team_thread_id', $args['teamThreadId'])
            ->with(['user:id,name,picture', 'files', 'reactions.user', 'reads'])
            ->orderBy('updated_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'teamThreadId' => $args['teamThreadId'],
            'data' => $teamMessages->items(),
            'paginatorInfo' => [
                'count' => $teamMessages->count(),
                'currentPage' => $teamMessages->currentPage(),
                'hasMorePages' => $teamMessages->hasMorePages(),
            ],
        ];
    }
}
