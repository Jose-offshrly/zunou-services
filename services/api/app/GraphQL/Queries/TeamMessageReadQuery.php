<?php

namespace App\GraphQL\Queries;

use App\Models\TeamMessage;
use Illuminate\Support\Facades\Auth;

final readonly class TeamMessageReadQuery
{
    public function __invoke(TeamMessage $teamMessage): bool
    {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        return $teamMessage->isReadBy($user);
    }
}
