<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Models\MeetingSession;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

readonly class MeetingSessionQuery
{
    public function collabs($_, array $args): Collection
    {
        $userId = Auth::id();

        return MeetingSession::query()
            ->when(
                $args['pulseId'] ?? null,
                fn ($q) => $q->where('pulse_id', $args['pulseId']),
            )
            ->where('organization_id', $args['organizationId'])
            ->where('type', MeetingSessionType::COLLAB->value)
            ->when(
                $args['default'] ?? null,
                fn ($q) => $q
                    ->whereIn('status', [
                        MeetingSessionStatus::ACTIVE->value,
                        MeetingSessionStatus::PAUSED->value,
                    ])
                    ->whereHas('attendees', function ($q) use ($userId) {
                        $q->where('user_id', $userId);
                    }),
            )
            ->with(['attendees.user']) // eager load
            ->get();
    }
}
