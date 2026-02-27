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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

readonly class EventInstancesQuery
{
    public function __invoke($rootValue, array $args, $context, ResolveInfo $resolveInfo): array
    {
        $userId = $args['userId'] ?? null;
        $user   = $userId ? User::select(['id', 'timezone'])->find($userId) : Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $organizationId = $args['organizationId'] ?? null;
        $pulseId        = $args['pulseId'] ?? null;

        if (! $organizationId) {
            throw new Error('organizationId is required');
        }

        if (! $pulseId) {
            throw new Error('pulseId is required');
        }

        $sortOrder = in_array(strtolower($args['sortOrder'] ?? 'asc'), ['asc', 'desc'])
            ? strtolower($args['sortOrder'] ?? 'asc')
            : 'asc';

        if (($args['hasMeetingSession'] ?? null) && ($args['hasNoMeetingSession'] ?? null)) {
            throw new Error('hasMeetingSession and hasNoMeetingSession are mutually exclusive');
        }

        $eagerLoads = $this->buildEagerLoads($resolveInfo);

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
            return $query->get()->all();
        } catch (QueryException $e) {
            Log::error('EventInstancesQuery: database error', [
                'organizationId' => $organizationId,
                'pulseId'        => $pulseId,
                'error'          => $e->getMessage(),
            ]);

            throw new Error('Failed to load event instances. Please try again.');
        }
    }

    private function buildEagerLoads(ResolveInfo $resolveInfo): array
    {
        $fields     = $resolveInfo->getFieldSelection(4);
        $eagerLoads = [];

        if (isset($fields['event'])) {
            $eagerLoads[] = 'event:id,name,date,start_at,end_at,location,priority,guests,organization_id,user_id,google_event_id,link,summary,recurring_event_id,pulse_id';

            if (isset($fields['event']['recurringEvent'])) {
                $eagerLoads[] = 'event.recurringEvent:id';
            }

            if (isset($fields['event']['attendees']) || isset($fields['event']['participants'])) {
                $eagerLoads[] = 'event.attendees:id,entity_id,entity_type,user_id';
                $eagerLoads[] = 'event.attendees.user:id,name,email';
                $eagerLoads[] = 'event.recurringEventAttendees:id,recurring_event_id,user_id';
                $eagerLoads[] = 'event.recurringEventAttendees.user:id,name,email';
            }

            if (isset($fields['event']['user'])) {
                $eagerLoads[] = 'event.user:id,name,email';
            }

            if (isset($fields['event']['eventSource'])) {
                $eagerLoads[] = 'event.eventSource:id,name';
            }

            if (isset($fields['event']['pulse'])) {
                $eagerLoads[] = 'event.pulse:id,name';
            }

            if (isset($fields['event']['organization'])) {
                $eagerLoads[] = 'event.organization:id,name';
            }

            if (isset($fields['event']['agendas'])) {
                $eagerLoads[] = 'event.agendas';
            }

            if (isset($fields['event']['actionables'])) {
                $eagerLoads[] = 'event.actionables';
            }

            if (isset($fields['event']['meetingSession'])) {
                $eagerLoads[] = 'event.meetingSession:id,event_instance_id,meeting_id,meeting_url,status,name,description,start_at,end_at,invite_pulse,gcal_meeting_id,recurring_invite,data_source_id';

                if (isset($fields['event']['meetingSession']['dataSource'])) {
                    $eagerLoads[] = 'event.meetingSession.dataSource:id,name';
                }
            }
        }

        if (isset($fields['meetingSession'])) {
            $eagerLoads[] = 'meetingSession:id,event_instance_id,meeting_id,meeting_url,status,name,description,start_at,end_at,invite_pulse,gcal_meeting_id,recurring_invite,data_source_id';

            if (isset($fields['meetingSession']['dataSource'])) {
                $eagerLoads[] = 'meetingSession.dataSource:id,name';
            }
        }

        if (isset($fields['pulse'])) {
            $eagerLoads[] = 'pulse:id,name';
        }

        return $eagerLoads;
    }

    private function applyFilters($query, array $args, string $userTimezone): void
    {
        $dateRange                       = $args['dateRange'] ?? null;
        $searchRaw                       = isset($args['search']) ? trim($args['search']) : '';
        $search                          = $searchRaw !== '' ? $searchRaw : null;
        $hasMeetingSession               = $args['hasMeetingSession']               ?? null;
        $hasMeetingSessionWithDataSource = $args['hasMeetingSessionWithDataSource'] ?? null;
        $hasNoMeetingSession             = $args['hasNoMeetingSession']             ?? null;

        if (! empty($dateRange)) {
            [$startDateTime, $endDateTime] = $this->resolveDateRangeUtc($dateRange, $userTimezone);

            $query->whereHas('event', function ($q) use ($startDateTime, $endDateTime) {
                $q->where('start_at', '<=', $endDateTime)
                  ->where('end_at', '>=', $startDateTime);
            });
        }

        if ($search) {
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

