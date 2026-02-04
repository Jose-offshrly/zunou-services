<?php

namespace App\GraphQL\Mutations;

use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class ReadNotificationsMutation
{
    public function __invoke($_, array $args)
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        // Get all unread notifications for the user
        $notifications = $user
            ->notifications()
            ->wherePivot('read_at', null)
            ->get();

        // Mark all as read
        foreach ($notifications as $notification) {
            $notification
                ->users()
                ->updateExistingPivot($user->id, ['read_at' => now()]);
        }

        return $notifications;
    }
}
