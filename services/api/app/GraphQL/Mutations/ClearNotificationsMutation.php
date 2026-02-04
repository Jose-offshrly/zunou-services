<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Notification;

final readonly class ClearNotificationsMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = auth()->user();
        $pulseId = $args['pulseId'];

        // Get all notifications for the pulse
        $notifications = Notification::forPulse($pulseId)
            ->where(function ($query) use ($user) {
                // Include notifications that either:
                // 1. Don't have a pivot record for this user yet
                $query
                    ->whereDoesntHave('users', function ($q) use ($user) {
                        $q->where('users.id', $user->id);
                    })
                    // 2. OR have an unarchived pivot record
                    ->orWhereHas('users', function ($q) use ($user) {
                        $q->where('users.id', $user->id)->where(
                            'notification_user.is_archived',
                            false
                        );
                    });
            })
            ->get();

        // Update or create the notification_users records to be archived
        $notifications->each(function ($notification) use ($user) {
            $notification->users()->syncWithoutDetaching([
                $user->id => [
                    'is_archived' => true,
                    'read_at' => now(),
                ],
            ]);
        });

        return true;
    }
}
