<?php

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\Topic;
use Illuminate\Support\Facades\Auth;

final readonly class TopicUnreadCountQuery
{
    public function __invoke(Topic $topic): int
    {
        $user = Auth::user();

        if (!$user) {
            return 0;
        }

        return TeamMessage::where('topic_id', $topic->id)
            ->when($topic->entity_type === TeamThread::class && $topic->entity_id, function ($q) use ($topic) {
                $q->where('team_thread_id', $topic->entity_id);
            })
            ->whereNull('deleted_at')
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->count();
    }
}
