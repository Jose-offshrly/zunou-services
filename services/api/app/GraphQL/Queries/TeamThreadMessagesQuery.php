<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Support\Facades\Auth;

final readonly class TeamThreadMessagesQuery
{
    /**
     * @param  array{}  $args
     * @return array{data: array<TeamMessage>, paginatorInfo: array{count: int, currentPage: int, hasMorePages: bool, lastPage: int, perPage: int, total: int}}
     */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;
        $user = Auth::user();

        // Find the team thread by pulse ID
        $teamThread = TeamThread::where('pulse_id', $args['pulseId'])->first();

        if (!$teamThread) {
            // Return an explicit empty paginator structure
            return [
                'data' => [],
                'paginatorInfo' => [
                    'count' => 0,
                    'currentPage' => $page,
                    'hasMorePages' => false,
                    'lastPage' => 1,
                    'perPage' => $perPage,
                    'total' => 0,
                ],
            ];
        }

        // Start building the query with withTrashed
        $query = TeamMessage::withTrashed()
            ->where('team_thread_id', $teamThread->id)
            ->where(function ($query) {
                $query
                    ->where(function ($q) {
                        $q->where('is_parent_reply', true)->whereNotNull(
                            'reply_team_thread_id'
                        );
                    })
                    ->orWhere(function ($q) {
                        $q->where('is_parent_reply', false)->whereNull(
                            'reply_team_thread_id'
                        );
                    });
            })
            ->where('is_system', false)
            ->with(['user:id,name,picture', 'topic:id,name', 'files', 'reactions.user', 'reads']);

        // Apply topic filter if requested
        if (!empty($args['topicId'])) {
            $query->where('topic_id', $args['topicId']);
        } else {
            // If no topicId provided, exclude messages with topics (only show messages without topics)
            $query->whereNull('topic_id');
        }

        // Apply unread filter if requested
        if (!empty($args['unreadOnly']) && $user) {
            $query->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            });
        }

        // Get paginated results
        $messages = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'teamThreadId' => $teamThread->id,
            'data' => $messages->items(),
            'paginatorInfo' => [
                'count' => $messages->count(),
                'currentPage' => $messages->currentPage(),
                'hasMorePages' => $messages->hasMorePages(),
                'lastPage' => $messages->lastPage(),
                'perPage' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ];
    }
}
