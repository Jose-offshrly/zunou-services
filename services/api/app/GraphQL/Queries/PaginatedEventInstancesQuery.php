<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Event;
use App\Models\EventInstance;
use App\Models\User;
use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;
use GraphQL\Error\Error;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

readonly class PaginatedEventInstancesQuery
{
    public function __invoke($rootValue, array $args, $context, ResolveInfo $resolveInfo): array
    {
        $userId = $args['userId'] ?? null;
        $user   = $userId ? User::select(['id', 'timezone'])->find($userId) : Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $organizationId                  = $args['organizationId'] ?? null;
        $pulseId                         = $args['pulseId'] ?? null;

        if (! $organizationId) {
            throw new Error('organizationId is required');
        }

        if (! $pulseId) {
            throw new Error('pulseId is required');
        }

        $sortOrder = in_array(strtolower($args['sortOrder'] ?? 'asc'), ['asc', 'desc']) ? strtolower($args['sortOrder'] ?? 'asc') : 'asc';
        $page      = max((int) ($args['page']    ?? 1), 1);
        $perPage   = min((int) ($args['perPage'] ?? 25), 100);

        if (($args['hasMeetingSession'] ?? null) && ($args['hasNoMeetingSession'] ?? null)) {
            throw new Error('hasMeetingSession and hasNoMeetingSession are mutually exclusive');
        }

        // Only eager-load relationships that are actually requested in the GraphQL selection.
        // This avoids firing 5 extra queries when the caller only needs id/event_id.
        $dataFields  = $resolveInfo->getFieldSelection(4)['data'] ?? [];
        $eagerLoads  = [];

        if (isset($dataFields['event'])) {
            $eagerLoads[] = 'event:id,name,date,start_at,end_at,location,priority,guests,organization_id,user_id,google_event_id,link,summary,recurring_event_id';

            if (isset($dataFields['event']['recurringEvent'])) {
                $eagerLoads[] = 'event.recurringEvent:id';
            }

            if (isset($dataFields['event']['attendees']) || isset($dataFields['event']['participants'])) {
                // Load both morph-based attendees and recurring event attendees
                $eagerLoads[] = 'event.attendees:id,entity_id,entity_type,user_id';
                $eagerLoads[] = 'event.attendees.user:id,name,email';
                $eagerLoads[] = 'event.recurringEventAttendees:id,recurring_event_id,user_id';
                $eagerLoads[] = 'event.recurringEventAttendees.user:id,name,email';
            }
        }

        if (isset($dataFields['meetingSession'])) {
            $eagerLoads[] = 'meetingSession:id,event_instance_id,meeting_id,meeting_url,status,name,description,start_at,end_at,invite_pulse,gcal_meeting_id,recurring_invite';
        }

        $query = EventInstance::query()
            ->with($eagerLoads)
            ->select('event_instances.*')
            ->whereHas('event', fn ($q) => $q->where('organization_id', $organizationId))
            ->where('event_instances.pulse_id', $pulseId)
            ->orderBy(
                Event::select('start_at')
                    ->whereColumn('id', 'event_instances.event_id')
                    ->limit(1),
                $sortOrder
            );

        $userTimezone = $user->timezone ?? config('app.timezone');

        $this->applyFilters($query, $args, $userTimezone);

        try {
            $total     = (clone $query)->toBase()->getCountForPagination();
            $items     = $query->forPage($page, $perPage)->get();
            $paginated = new LengthAwarePaginator($items, $total, $perPage, $page);
        } catch (QueryException $e) {
            Log::error('PaginatedEventInstancesQuery: database error', [
                'organizationId' => $organizationId,
                'pulseId'        => $pulseId,
                'error'          => $e->getMessage(),
            ]);

            throw new Error('Failed to load event instances. Please try again.');
        }

        return [
            'data'          => $items->all(),
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

    private function applyFilters($query, array $args, string $userTimezone): void
    {
        $dateRange                       = $args['dateRange'] ?? null;
        $searchRaw = isset($args['search']) ? trim($args['search']) : '';
        $search    = $searchRaw !== '' ? $searchRaw : null;
        $hasMeetingSession               = $args['hasMeetingSession']               ?? null;
        $hasMeetingSessionWithDataSource = $args['hasMeetingSessionWithDataSource'] ?? null;
        $hasNoMeetingSession             = $args['hasNoMeetingSession']             ?? null;

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

        if (! empty($dateRange)) {
            [$startDateTime, $endDateTime] = $this->resolveDateRangeUtc($dateRange, $userTimezone);

            $query->whereHas('event', function ($q) use ($startDateTime, $endDateTime) {
                $q->where('start_at', '<=', $endDateTime)
                  ->where('end_at', '>=', $startDateTime);
            });
        }

        if ($search) {
            // Use ILIKE for case-insensitive search (PostgreSQL native operator)
            // Combined with GIN trigram index (events_name_trgm_idx) for efficient substring matching
            $query->whereHas('event', function ($q) use ($search) {
                $q->where('name', 'ILIKE', '%'.$search.'%')
                  ->orWhere('date', 'ILIKE', '%'.$search.'%');
            });
        }

        if ($hasMeetingSession) {
            $query->whereHas('meetingSession');
        }

        if ($hasMeetingSessionWithDataSource) {
            $query->whereHas('meetingSession', fn ($q) => $q->whereNotNull('data_source_id'));
        }

        if ($hasNoMeetingSession) {
            $query->whereDoesntHave('meetingSession');
        }
    }

    /** @return array{Carbon, Carbon} */
    private function resolveDateRangeUtc(array $dateRange, string $userTimezone): array
    {
        try {
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
        } catch (InvalidFormatException $e) {
            throw new Error('Invalid dateRange: '.$e->getMessage());
        }
    }
}
