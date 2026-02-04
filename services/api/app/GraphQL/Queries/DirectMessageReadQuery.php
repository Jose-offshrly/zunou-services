<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessage;
use Illuminate\Support\Facades\Auth;

final readonly class DirectMessageReadQuery
{
    public function __invoke(DirectMessage $directMessage): bool
    {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        // Check if the message has been read by the user
        return $directMessage
            ->reads()
            ->where('user_id', $user->id)
            ->exists();
    }
}
