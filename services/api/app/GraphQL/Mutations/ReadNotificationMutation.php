<?php

namespace App\GraphQL\Mutations;

use App\Models\Notification;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class ReadNotificationMutation
{
    public function __invoke($_, array $args): Notification
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $notification = Notification::findOrFail(
            $args['input']['notificationId'],
        );

        // Attach the user to the notification with additional pivot data
        $notification->users()->syncWithoutDetaching([
            $user->id => ['read_at' => now()],
        ]);

        return $notification->refresh();
    }
}
