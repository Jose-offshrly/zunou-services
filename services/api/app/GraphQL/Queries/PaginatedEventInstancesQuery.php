<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\EventInstance;
use App\Models\User;
use Carbon\Carbon;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

readonly class PaginatedEventInstancesQuery
{
    public function __invoke($rootValue, array $args): array
    {
        $userId = $args['userId'] ?? null;
        $user   = $userId ? User::find($userId) : Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $organizationId                  = $args['organizationId'];
        $pulseId                         = $args['pulseId'];
        $dateRange                       = $args['dateRange'] ?? null;
        $searchRaw                       = isset($args['search']) ? trim($args['search']) : '';
        $search                          = $searchRaw !== '' ? $searchRaw : null;
        $sortOrder                       = in_array(strtolower($args['sortOrder'] ?? 'asc'), ['asc', 'desc']) ? strtolower($args['sortOrder'] ?? 'asc') : 'asc';
        $page                            = max((int) ($args['page']    ?? 1), 1);
        $perPage                         = min((int) ($args['perPage'] ?? 25), 100);
        $hasMeetingSession               = $args['hasMeetingSession']               ?? null;
        $hasMeetingSessionWithDataSource = $args['hasMeetingSessionWithDataSource'] ?? null;
        $hasNoMeetingSession             = $args['hasNoMeetingSession']             ?? null;

        if ($hasMeetingSession && $hasNoMeetingSession) {
            throw new Error('hasMeetingSession and hasNoMeetingSession are mutually exclusive');
        }

        $query = EventInstance::query()
            ->with([
                'event.attendees.user',
                'event.meetingSession.dataSource',
                'event.user',
                'event.eventSource',
                'event.pulse',
                'event.organization',
                'event.agendas',
                'event.actionables',
                'pulse',
            ])
            ->select('event_instances.*')
            ->join('events', function ($join) use ($organizationId) {
                $join->on('events.id', '=', 'event_instances.event_id')
                     ->where('events.organization_id', $organizationId)
                     ->whereNull('events.deleted_at');
            })
            ->where('event_instances.pulse_id', $pulseId);

        // If caller requested attachment info, add a left join that marks
        // whether an event (by event_id) is already attached to another pulse.
        if (! empty($args['teamPulseId'])) {
            $teamPulseId = $args['teamPulseId'];

            $query->leftJoin('event_instances as t', function ($join) use ($teamPulseId) {
                $join->on('t.event_id', '=', 'event_instances.event_id')
                     ->where('t.pulse_id', $teamPulseId)
                     ->whereNull('t.deleted_at');
            })
            ->addSelect(DB::raw('CASE WHEN t.event_id IS NOT NULL THEN 1 ELSE 0 END AS already_added'));
        }

        $query->orderBy('events.start_at', $sortOrder);



        // Apply date range filter through the related event
        $userTimezone = $user->timezone ?? config('app.timezone');

        // Handle missing or invalid date range
        $hasValidDateRange = $dateRange && is_array($dateRange) && count($dateRange) > 0;

        if ($hasValidDateRange) {
            [$startDateTime, $endDateTime] = $this->resolveDateRangeUtc($dateRange, $userTimezone);

            $query->where('events.start_at', '<=', $endDateTime) // starts before range ends
                ->where('events.end_at', '>=', $startDateTime); // ends after range starts
        }

        // Apply search filter through the related event (case-insensitive)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(events.name) LIKE ?', [
                    '%'.strtolower($search).'%',
                ])
                    ->orWhere('events.date', 'like', '%'.$search.'%');
            });
        }

        // Filter: Only event instances that have a related meeting session
        if ($hasMeetingSession) {
            $query->whereHas('meetingSession');
        }

        // Filter: Only event instances that have a meeting session with a data source
        if ($hasMeetingSessionWithDataSource) {
            $query->whereHas('meetingSession', function ($q) {
                $q->whereNotNull('data_source_id');
            });
        }

        // Filter: Only event instances without a meeting session
        if ($hasNoMeetingSession) {
            $query->whereDoesntHave('meetingSession');
        }

        // Use built-in paginate for database-level pagination
        $paginated = $query->paginate(perPage: $perPage, page: $page);
        $items = $paginated->items();

        // Return simple paginated response structure
        return [
            'data'          => $items,
            'paginatorInfo' => [
                'count'        => count($items),
                'currentPage'  => $paginated->currentPage(),
                'firstItem'    => $paginated->firstItem(),
                'hasMorePages' => $paginated->hasMorePages(),
                'lastItem'     => $paginated->lastItem(),
                'lastPage'     => $paginated->lastPage(),
                'perPage'      => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ];
    }

    /** @return array{Carbon, Carbon} */
    private function resolveDateRangeUtc(array $dateRange, string $userTimezone): array
    {
        if (count($dateRange) === 1) {
            $singleDate = Carbon::parse($dateRange[0], $userTimezone);

            return [
                $singleDate->copy()->startOfDay()->utc(),
                $singleDate->copy()->endOfDay()->utc(),
            ];
        }

        return [
            Carbon::parse($dateRange[0], $userTimezone)->utc(),
            Carbon::parse($dateRange[1], $userTimezone)->utc(),
        ];
    }
}
