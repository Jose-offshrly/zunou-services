<?php

namespace App\GraphQL\Queries;

use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

final readonly class PulseNotificationsQuery
{
    public function __invoke(null $_, array $args)
    {
        $pulseId = $args['pulseId'] ?? null;
        $authId  = Auth::id();

        return Notification::select(
            'notifications.*',
            'nu.read_at as read_at',
            'nu.is_archived as is_archived'
        )
            ->join('notification_user as nu', 'nu.notification_id', '=', 'notifications.id')
            ->when($pulseId, fn ($query) => $query->where('notifications.pulse_id', $pulseId))
            ->whereNotNull('notifications.pulse_id')
            ->where('nu.user_id', $authId)
            ->where('nu.is_archived', false)
            ->with('pulse')
            ->orderByRaw('CASE WHEN nu.read_at IS NULL THEN 0 ELSE 1 END ASC')
            ->orderBy('notifications.created_at', 'desc')
            ->get();
    }
}
