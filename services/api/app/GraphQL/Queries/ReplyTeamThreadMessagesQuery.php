<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\ReplyTeamThread;
use App\Models\TeamMessage;

final readonly class ReplyTeamThreadMessagesQuery
{
    /**
     * @param  array{}  $args
     * @return array{data: array<ReplyTeamThread>, paginatorInfo: array{count: int, currentPage: int, hasMorePages: bool, lastPage: int, perPage: int, total: int}}
     */
    public function __invoke(null $_, array $args)
    {
        $input   = $args['input'] ?? [];
        $perPage = 10;
        $page    = $input['page'] ?? 1;

        // Find the team thread by pulse ID
        $replyTeamThread = ReplyTeamThread::where(
            'id',
            $input['replyTeamThreadId'],
        )->first();

        if (! $replyTeamThread) {
            // Return an explicit empty paginator structure
            return [
                'data'          => [],
                'paginatorInfo' => [
                    'count'        => 0,
                    'currentPage'  => $page,
                    'hasMorePages' => false,
                    'lastPage'     => 1,
                    'perPage'      => $perPage,
                    'total'        => 0,
                ],
            ];
        }

        // Get the team messages for this team thread
        $paginator = TeamMessage::where(
            'reply_team_thread_id',
            $replyTeamThread->id,
        )
            ->where('is_system', false)
            ->withTrashed()
            ->with(['user:id,name,picture', 'files', 'reactions.user', 'reads'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data'          => $paginator->items(),
            'paginatorInfo' => [
                'count'        => $paginator->count(),
                'currentPage'  => $paginator->currentPage(),
                'hasMorePages' => $paginator->hasMorePages(),
                'lastPage'     => $paginator->lastPage(),
                'perPage'      => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ];
    }
}
