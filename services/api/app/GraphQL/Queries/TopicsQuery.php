<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\TeamThread;
use App\Models\Thread;
use App\Models\Topic;
use Illuminate\Support\Facades\Auth;

final readonly class TopicsQuery
{
    /**
     * @param  array{}  $args
     * @return array{data: array<Topic>, paginatorInfo: array{count: int, currentPage: int, hasMorePages: bool, lastPage: int, perPage: int, total: int}}
     */
    public function __invoke(null $_, array $args)
    {
        $perPage = 10;
        $page = $args['page'] ?? 1;
        $user = Auth::user();

        $query = Topic::query();

        if ($args['type'] === 'teamThread') {
            // Filter by TeamThread entity type and also by pulseId/organizationId through the team thread
            // Get team thread IDs that match the pulse and organization
            $teamThreadIds = TeamThread::where('pulse_id', $args['pulseId'])
                ->where('organization_id', $args['organizationId'])
                ->pluck('id');

            $query
                ->where('entity_type', TeamThread::class)
                ->whereIn('entity_id', $teamThreadIds);

            // Preload entities and unread counts to avoid N+1 queries
            $query->with('entity');

            if ($user) {
                $query->withCount([
                    'teamMessages as unread_count' => function ($q) use (
                        $user
                    ) {
                        $q->whereDoesntHave('reads', function ($readQuery) use (
                            $user
                        ) {
                            $readQuery->where('user_id', $user->id);
                        });
                    },
                ]);

                $query
                    ->orderByRaw(
                        '(SELECT COUNT(*) FROM team_messages tm LEFT JOIN team_message_reads r ON r.team_message_id = tm.id AND r.user_id = ? WHERE tm.topic_id = topics.id AND r.id IS NULL AND tm.deleted_at IS NULL) > 0 DESC',
                        [$user->id]
                    )
                    ->orderByDesc('updated_at');
            } else {
                // If no authenticated user, fall back to updated_at ordering
                $query->orderBy('updated_at', 'desc');
            }

            $topics = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'data' => $topics->items(),
                'paginatorInfo' => [
                    'count' => $topics->count(),
                    'currentPage' => $topics->currentPage(),
                    'hasMorePages' => $topics->hasMorePages(),
                    'lastPage' => $topics->lastPage(),
                    'perPage' => $topics->perPage(),
                    'total' => $topics->total(),
                ],
            ];
        } else {
            // Filter by Thread entity type and also by pulseId/organizationId through the thread
            // Get thread IDs that match the pulse and organization
            $threadIds = Thread::forPulse($args['pulseId'])
                ->forOrganization($args['organizationId'])
                ->where('is_topic', true)
                ->pluck('id');

            $query
                ->where('entity_type', Thread::class)
                ->whereIn('entity_id', $threadIds);

            // Preload entity with messages to avoid N+1 when accessing topic.messages
            $query->with(['entity' => function ($morphTo) {
                $morphTo->morphWith([
                    Thread::class => ['messages.user'],
                ]);
            }]);

            // Preload unread counts to avoid N+1 queries
            if ($user) {
                $query->withCount([
                    'teamMessages as unread_count' => function ($q) use ($user) {
                        $q->whereDoesntHave('reads', function ($readQuery) use ($user) {
                            $readQuery->where('user_id', $user->id);
                        });
                    },
                ]);
            }

            $topics = $query
                ->orderBy('updated_at', 'desc')
                ->paginate($perPage, ['*'], 'page', $page);

            return [
                'data' => $topics->items(),
                'paginatorInfo' => [
                    'count' => $topics->count(),
                    'currentPage' => $topics->currentPage(),
                    'hasMorePages' => $topics->hasMorePages(),
                    'lastPage' => $topics->lastPage(),
                    'perPage' => $topics->perPage(),
                    'total' => $topics->total(),
                ],
            ];
        }
    }
}
