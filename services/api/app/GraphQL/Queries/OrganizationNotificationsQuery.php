<?php

namespace App\GraphQL\Queries;

use App\Models\Notification;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;

final readonly class OrganizationNotificationsQuery
{
    public function __invoke(null $_, array $args)
    {
        $user = auth()->user();
        if (!$user) {
            throw new Error('No user was found');
        }

        $pulses = $user->pulseMemberships->pluck('pulse_id')->toArray();

        $organizationId = $args['organizationId'];
        $perPage = $args['perPage'] ?? 10;
        $page = $args['page'] ?? 1;

        // Build the base query with all filters
        $baseQuery = Notification::forOrganization($organizationId)
            ->where(function ($query) use ($pulses) {
                if (!empty($pulses)) {
                    $query
                        ->whereIn('pulse_id', $pulses)
                        ->orWhereNull('pulse_id');
                } else {
                    $query->whereNull('pulse_id');
                }
            })
            ->where(function ($query) use ($user) {
                // Include org-wide/pulse-wide notifications (no users targeted)
                // OR notifications targeted to the current user that are not archived
                $query
                    ->whereDoesntHave('users')
                    ->orWhereHas('users', function ($q) use ($user) {
                        $q->where('users.id', $user->id)->where(function (
                            $subQuery
                        ) {
                            // Include if no pivot record exists (not archived)
                            // OR if pivot record exists but is_archived is false
                            $subQuery
                                ->whereNull('notification_user.is_archived')
                                ->orWhere(
                                    'notification_user.is_archived',
                                    false
                                );
                        });
                    });
            });

        // Use a single query with ROW_NUMBER() to get the latest notification per description
        // This eliminates the N+1 query problem by doing it all in one query
        $subQuery = (clone $baseQuery)->selectRaw('*, ROW_NUMBER() OVER (
                PARTITION BY description 
                ORDER BY CASE WHEN status = \'pending\' THEN 0 ELSE 1 END, 
                         created_at DESC, 
                         id DESC
            ) as rn');

        $latestNotificationIds = DB::table(
            DB::raw("({$subQuery->toSql()}) as sub")
        )
            ->mergeBindings($subQuery->getQuery())
            ->where('rn', 1)
            ->pluck('id')
            ->toArray();

        if (empty($latestNotificationIds)) {
            return Notification::with([
                'organization',
                'pulse.members.user',
                'context',
                'users',
                'summary',
            ])
                ->whereRaw('1 = 0') // Return empty result
                ->paginate($perPage, ['*'], 'page', $page);
        }

        return Notification::with([
            'organization',
            'pulse.members.user',
            'context',
            'users',
            'summary',
        ])
            ->whereIn('id', $latestNotificationIds)
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }
}
