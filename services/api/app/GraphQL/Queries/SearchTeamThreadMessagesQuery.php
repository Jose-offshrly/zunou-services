<?php declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use Illuminate\Support\Facades\Auth;

final readonly class SearchTeamThreadMessagesQuery
{
    /**
     * @param array{pulseId:string, organizationId:string, topicId?:string|null, page?:int, query:string, order?:string} $args
     * @return array{teamThreadId: string|null, data: array<TeamMessage>, paginatorInfo: array{count: int, currentPage: int, hasMorePages: bool, lastPage: int, perPage: int, total: int}}
     */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;
        $order = strtolower($args['order'] ?? 'desc');
        $order = in_array($order, ['asc', 'desc'], true) ? $order : 'desc';
        $query = trim($args['query'] ?? '');
        $user = Auth::user();

        // Find the team thread by pulse ID
        $teamThread = TeamThread::where('pulse_id', $args['pulseId'])->first();

        if (!$teamThread) {
            return [
                'teamThreadId' => null,
                'data' => [],
                'paginatorInfo' => [
                    'count' => 0,
                    'currentPage' => (int) $page,
                    'hasMorePages' => false,
                    'lastPage' => 1,
                    'perPage' => $perPage,
                    'total' => 0,
                ],
            ];
        }

        // Start building the base query - include all messages (parent replies, regular messages, and child messages)
        $builder = TeamMessage::withTrashed()
            ->where('team_thread_id', $teamThread->id)
            ->where('is_system', false)
            ->with(['user:id,name,picture', 'topic:id,name', 'files', 'reactions.user', 'reads']);

        // Apply topic filter (same semantics as default query)
        if (!empty($args['topicId'])) {
            $builder->where('topic_id', $args['topicId']);
        } else {
            $builder->whereNull('topic_id');
        }

        // Apply unread filter if present in args for parity (schema has guard/canModel; unreadOnly is not defined here)
        if (!empty($args['unreadOnly']) && $user) {
            $builder->whereDoesntHave('reads', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        // Apply search - use simple ILIKE on content text for reliability
        // This avoids JSON parsing errors on malformed content in the database
        if ($query !== '') {
            $escaped = str_replace(
                ['%', '_', '\\'],
                ['\\%', '\\_', '\\\\'],
                $query
            );
            $searchPattern = '%' . $escaped . '%';

            // Simple text search across all content
            // This will match the search term anywhere in the content field
            $builder->where('content', 'ILIKE', $searchPattern);
        }

        // Execute with ordering and pagination
        $messages = $builder
            ->orderBy('created_at', $order)
            ->paginate($perPage, ['*'], 'page', (int) $page);

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
