<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessageThread;
use Illuminate\Support\Facades\Auth;

final readonly class DirectMessageUnreadCountQuery
{
    public function __invoke(DirectMessageThread $thread): int
    {
        $user = Auth::user();
        if (! $user) {
            return 0;
        }

        return $thread
            ->directMessages()
            ->where('sender_id', '!=', $user->id)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->count();
    }
}
