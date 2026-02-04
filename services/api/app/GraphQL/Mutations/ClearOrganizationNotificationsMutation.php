<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Notification;

final readonly class ClearOrganizationNotificationsMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user           = auth()->user();
        $organizationId = $args['organizationId'];

        // Get all notifications for the organization
        $notifications = Notification::where('organization_id', $organizationId)
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
                            false,
                        );
                    });
            })
            ->get();

        // Update or create the notification_users records to be archived
        $notifications->each(function ($notification) use ($user) {
            $notification->users()->syncWithoutDetaching([
                $user->id => [
                    'is_archived' => true,
                    'read_at'     => now(),
                ],
            ]);
        });

        return true;
    }
}

