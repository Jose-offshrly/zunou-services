<?php

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;
use Illuminate\Support\Facades\Auth;

final readonly class TeamMessageUnreadCountQuery
{
    public function __invoke($parent): int
    {
        $user = Auth::user();
        if (! $user) {
            return 0;
        }

        return TeamMessage::getUnreadCount($parent['teamThreadId'], $user);
    }
}
