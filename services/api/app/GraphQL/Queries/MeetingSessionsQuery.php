<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\MeetingSession;
use App\Models\PulseMember;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

readonly class MeetingSessionsQuery
{
    public function __invoke($root, array $args)
    {
        $query = MeetingSession::query();

        if (isset($args['organizationId'])) {
            $query->where('organization_id', $args['organizationId']);
        }

        if (isset($args['pulseId'])) {
            $query->where('pulse_id', $args['pulseId']);
        }

        if (isset($args['userId'])) {
            $query->where('user_id', $args['userId']);
        }

        if (isset($args['status'])) {
            $query->where('status', $args['status']);
        }

        if (isset($args['onDate'])) {
            $query->whereDate('start_at', $args['onDate']);
        }

        // Get user for timezone conversion
        $userId       = $args['userId'] ?? Auth::id();
        $user         = $userId ? User::find($userId) : Auth::user();
        $userTimezone = $user?->timezone ?? config('app.timezone');

        // Date range filtering - apply to query builder first
        // Convert user timezone dates to UTC for database query
        if (isset($args['dateRange']) && count($args['dateRange']) === 2) {
            // Parse dates in user's timezone, then convert to UTC
            $start = Carbon::parse($args['dateRange'][0], $userTimezone)
                ->startOfDay()
                ->utc();
            $end = Carbon::parse($args['dateRange'][1], $userTimezone)
                ->endOfDay()
                ->utc();
            $query->whereBetween('start_at', [$start, $end]);
        }

        // Pulse membership filtering
        if (! isset($args['pulseId'])) {
            if ($userId) {
                $pulseIds = PulseMember::where('user_id', $userId)->pluck(
                    'pulse_id',
                );
                $query->whereIn('pulse_id', $pulseIds);
            }
        }

        // Eager load relationships to prevent N+1 queries
        $sessions = $query->with(['attendees.user', 'event.agendas'])->get();

        if (isset($args['dateRange']) && count($args['dateRange']) === 2) {
            // Use UTC dates for filtering (already converted above)
            $start = Carbon::parse($args['dateRange'][0], $userTimezone)
                ->startOfDay()
                ->utc();
            $end = Carbon::parse($args['dateRange'][1], $userTimezone)
                ->endOfDay()
                ->utc();

            $recurringSessions = $this->generateDailyRecurringSessions(
                $sessions,
                $start->toDateString(),
                $end->toDateString(),
            );

            $sessions = $sessions->concat($recurringSessions);

            $sessions = $sessions->filter(function ($session) use (
                $start,
                $end
            ) {
                // Parse session start_at as UTC since database stores in UTC
                $sessionDate = Carbon::parse($session->start_at, 'UTC');

                return $sessionDate->between($start, $end);
            });
        }

        return $sessions->sortByDesc('start_at')->values();
    }

    private function generateDailyRecurringSessions(
        Collection $sessions,
        string $startDate,
        string $endDate,
    ): Collection {
        // Parse dates as UTC since database stores timestamps in UTC
        $start = Carbon::parse($startDate, 'UTC')->startOfDay();
        $end   = Carbon::parse($endDate, 'UTC')->endOfDay();

        $generated = collect();

        foreach ($sessions as $session) {
            if (! $session->recurring_meeting_id) {
                continue;
            }

            // Parse session start_at as UTC since database stores in UTC
            $sessionStart = Carbon::parse($session->start_at, 'UTC');

            // Skip if the session's start_at falls outside or after the given date range
            if ($sessionStart->gte($end)) {
                continue;
            }

            // Set $current to the later of the date range start or the session start date (+1 day)
            // This ensures clones only begin after the session’s original start date
            $current = $start->greaterThan($sessionStart)
                ? $start->copy()
                : $sessionStart->copy()->addDay();

            while ($current->lte($end)) {
                // Build new datetime by combining $current's date + original time
                $rawStart         = $session->getRawOriginal('start_at');
                [, $rawStartTime] = explode(' ', $rawStart);
                $newStart         = $current->toDateString().' '.$rawStartTime;

                $attrs             = $session->getAttributes();
                $attrs['start_at'] = $newStart;

                if ($session->getRawOriginal('end_at')) {
                    $rawEnd          = $session->getRawOriginal('end_at');
                    [, $rawEndTime]  = explode(' ', $rawEnd);
                    $attrs['end_at'] = $current->toDateString().' '.$rawEndTime;
                }

                $clone         = $session->replicate();
                $clone->id     = (string) Str::uuid();
                $clone->exists = false;
                $clone->setRawAttributes($attrs);

                // Share loaded relations with the clone to prevent N+1 queries.
                // This is a shallow copy (shared references), which is intentional:
                // - Recurring instances share the same attendees by design
                // - Sessions are read-only after creation (returned to GraphQL)
                // - replicate() does not copy loaded relationships
                $clone->setRelations($session->getRelations());

                $generated->push($clone);

                $current->addDay();
            }
        }

        return $generated;
    }
}
