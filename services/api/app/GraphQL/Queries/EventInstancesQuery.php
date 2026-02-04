<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\EventInstance;
use App\Models\User;
use Carbon\Carbon;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

readonly class EventInstancesQuery
{
    public function __invoke($rootValue, array $args)
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
        $hasMeetingSession               = $args['hasMeetingSession']               ?? null;
        $hasMeetingSessionWithDataSource = $args['hasMeetingSessionWithDataSource'] ?? null;
        $hasNoMeetingSession             = $args['hasNoMeetingSession']             ?? null;

        $query = EventInstance::query()
            ->with([
                'event.attendees.user',
                'event.meetingSession',
                'event.meetingSession.dataSource',
                'event.user',
                'event.eventSource',
                'event.pulse',
                'event.organization',
                'event.agendas',
                'event.actionables',
                'pulse',
            ])
            ->whereHas('event', function ($q) use ($organizationId, $userId) {
                $q->where('organization_id', $organizationId)
                    ->where('user_id', $userId);
            })
            ->where('pulse_id', $pulseId)
            ->orderBy('created_at', $sortOrder);

        // Apply date range filter through the related event
        $userTimezone = $user->timezone ?? config('app.timezone');

        // Handle missing or invalid date range
        $hasValidDateRange = $dateRange && is_array($dateRange) && count($dateRange) > 0;

        if ($hasValidDateRange) {
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

            $query->whereHas('event', function ($q) use ($startDateTime, $endDateTime) {
                $q->where('start_at', '<=', $endDateTime) // starts before range ends
                    ->where('end_at', '>=', $startDateTime); // ends after range starts
            });
        }

        // Apply search filter through the related event (case-insensitive)
        if ($search) {
            $query->whereHas('event', function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [
                    '%'.strtolower($search).'%',
                ])
                    ->orWhere('date', 'like', '%'.$search.'%');
            });
        }

        // Filter: Only event instances with events that have a related meeting session
        if ($hasMeetingSession) {
            $query->whereHas('event.meetingSession');
        }

        // Filter: Only event instances with events that have a meeting session with a data source
        if ($hasMeetingSessionWithDataSource) {
            $query->whereHas('event.meetingSession', function ($q) {
                $q->whereNotNull('data_source_id');
            });
        }

        // Filter: Only event instances with events without a meeting session
        if ($hasNoMeetingSession) {
            $query->whereHas('event', function ($q) {
                $q->whereDoesntHave('meetingSession');
            });
        }

        return $query->get();
    }
}

