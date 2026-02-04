<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

readonly class EventsQuery
{
    public function __invoke($rootValue, array $args): array
    {
        $user = User::find($args['userId']) ?? Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $organizationId                  = $args['organizationId'];
        $pulseId                         = $args['pulseId'];
        $userId                          = $args['userId'];
        $dateRange                       = $args['dateRange'] ?? null;
        $search                          = $args['search']    ?? null;
        $sortOrder                       = strtolower($args['sortOrder'] ?? 'asc');
        $page                            = $args['page']                            ?? 1;
        $perPage                         = $args['perPage']                         ?? 10;
        $hasMeetingSession               = $args['hasMeetingSession']               ?? null;
        $hasMeetingSessionWithDataSource = $args['hasMeetingSessionWithDataSource'] ?? null;
        $hasNoMeetingSession             = $args['hasNoMeetingSession']             ?? null;

        $query = Event::query()
            ->with([
                'attendees.user',
                'meetingSession',
                'meetingSession.dataSource',
                'user',
                'eventSource',
                'pulse',
                'organization',
                'agendas',
                'actionables',
            ])
            ->where('organization_id', $organizationId)
            ->where('pulse_id', $pulseId)
            ->where('user_id', $userId)
            ->orderBy(
                DB::raw(
                    "start_at || ' ' || COALESCE(start_at::text, '00:00:00')",
                ),
                $sortOrder,
            );

        // Apply date range filter - default to NOW until end of day + 4 hours
        $userTimezone = $user->timezone ?? config('app.timezone');

        // Handle missing or invalid date range
        $hasValidDateRange = $dateRange && is_array($dateRange) && count($dateRange) > 0;

        if (! $hasValidDateRange) {
            $dateRange = [
                Carbon::now($userTimezone),
                Carbon::now($userTimezone)->endOfDay()->addHours(4),
            ];
        }

        // Handle single date - expand to full day
        $isSingleDate = count($dateRange) === 1;
        if ($isSingleDate) {
            $singleDate = Carbon::parse($dateRange[0], $userTimezone);
            $dateRange  = [
                $singleDate->copy()->startOfDay(),
                $singleDate->copy()->endOfDay(),
            ];
        }

        // Convert user timezone to UTC for database query
        $startDateTime = Carbon::parse($dateRange[0], $userTimezone)->utc();
        $endDateTime   = Carbon::parse($dateRange[1], $userTimezone)->utc();

        $query->where(function ($q) use ($startDateTime, $endDateTime) {
            $q->where('start_at', '<=', $endDateTime) // starts before range ends
                ->where('end_at', '>=', $startDateTime); // ends after range starts
        });

        // Apply search filter (case-insensitive)
        $query->when(
            $search,
            fn ($query, $search) => $query
                ->whereRaw('LOWER(name) LIKE ?', [
                    '%'.strtolower($search).'%',
                ])
                ->orWhere('date', 'like', '%'.$search.'%'),
        );

        // Filter: Only events with a related meeting session
        if ($hasMeetingSession) {
            $query->whereHas('meetingSession');
        }

        // Filter: Only events with a meeting session that has a data source
        if ($hasMeetingSessionWithDataSource) {
            $query->whereHas('meetingSession', function ($q) {
                $q->whereNotNull('data_source_id');
            });
        }

        // Filter: Only events without a meeting session
        if ($hasNoMeetingSession) {
            $query->whereDoesntHave('meetingSession');
        }

        // Get paginated results
        $paginatedEvents = $query->paginate($perPage, ['*'], 'page', $page);

        // Return simple paginated response structure
        return [
            'data'          => $paginatedEvents->items(),
            'paginatorInfo' => [
                'count'        => $paginatedEvents->count(),
                'currentPage'  => $paginatedEvents->currentPage(),
                'firstItem'    => $paginatedEvents->firstItem(),
                'hasMorePages' => $paginatedEvents->hasMorePages(),
                'lastItem'     => $paginatedEvents->lastItem(),
                'lastPage'     => $paginatedEvents->lastPage(),
                'perPage'      => $paginatedEvents->perPage(),
                'total'        => $paginatedEvents->total(),
            ],
        ];
    }
}
