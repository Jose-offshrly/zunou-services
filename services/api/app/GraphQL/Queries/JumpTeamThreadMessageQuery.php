<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use Illuminate\Support\Facades\Auth;
use App\Models\TeamMessage;
use App\Models\TeamThread;

final readonly class JumpTeamThreadMessageQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;
        $user = Auth::user();

        $teamThread = TeamThread::forPulse($args['pulseId'])->first();

        if (!$teamThread) {
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

        $query = TeamMessage::withTrashed()
            ->where('team_thread_id', $teamThread->id)
            ->where('is_system', false)
            ->with([
                'user:id,name,picture',
                'topic:id,name',
                'files',
                'reactions.user',
                'reads',
            ]);

        if (!empty($args['replyTeamThreadId'])) {
            $query->where('reply_team_thread_id', $args['replyTeamThreadId']);
        } else {
            $query->where(function ($query) {
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
            });
        }

        // Apply topic filter (removed duplicate)
        if (!empty($args['topicId'])) {
            $query->where('topic_id', $args['topicId']);
        } else {
            $query->whereNull('topic_id');
        }

        $target = TeamMessage::withTrashed()->find($args['messageId']);
        if ($target && $target->team_thread_id === $teamThread->id) {
            $orderedIds = (clone $query)
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->pluck('id');

            $index = $orderedIds->search($target->id);
            if ($index === false) {
                $index = 0;
            }

            $totalCount = $orderedIds->count();
            $newerCount = (int) $index; // items before target are newer in desc order
            $olderCount = max(0, $totalCount - $newerCount - 1);

            $page = (int) floor($newerCount / $perPage) + 1;
            $lastPage = max(1, (int) ceil($totalCount / $perPage));
            $page = max(1, min($page, $lastPage));
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
