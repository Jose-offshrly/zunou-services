<?php

namespace App\GraphQL\Mutations;

use App\Models\Notification;

class UpdateNotificationStatusMutation
{
    public function __invoke($_, array $args)
    {
        $notification = Notification::findOrFail(
            $args['input']['notificationId'],
        );
        $notification->update(['status' => $args['input']['status']]);

        return $notification->fresh();
    }
}
