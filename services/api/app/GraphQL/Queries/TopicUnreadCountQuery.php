<?php

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;
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

        // Use preloaded count if available, otherwise query
        if (isset($topic->unread_count)) {
            return (int) $topic->unread_count;
        }

        return TeamMessage::where('topic_id', $topic->id)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->count();
    }
}
