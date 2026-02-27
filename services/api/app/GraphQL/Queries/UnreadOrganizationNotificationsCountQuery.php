<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Notification;
use GraphQL\Error\Error;

final readonly class UnreadOrganizationNotificationsCountQuery
{
    public function __invoke($rootValue, array $args): int
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $organizationId = $args['organizationId'];
        $pulses         = $user->pulseMemberships->pluck('pulse_id')->toArray();

        return Notification::where('organization_id', $organizationId)
            ->where(function ($query) use ($pulses) {
                if (! empty($pulses)) {
                    $query->whereIn('pulse_id', $pulses)->orWhereNull('pulse_id');
                } else {
                    $query->whereNull('pulse_id');
                }
            })
            ->where(function ($query) use ($user) {
                // Broadcast notifications (no targeted users) are always unread
                $query->whereDoesntHave('users')
                    // Or targeted to this user and not yet read and not archived
                    ->orWhereHas('users', function ($q) use ($user) {
                        $q->where('users.id', $user->id)
                            ->whereNull('notification_user.read_at')
                            ->where(function ($sub) {
                                $sub->whereNull('notification_user.is_archived')
                                    ->orWhere('notification_user.is_archived', false);
                            });
                    });
            })
            ->count();
    }
}
