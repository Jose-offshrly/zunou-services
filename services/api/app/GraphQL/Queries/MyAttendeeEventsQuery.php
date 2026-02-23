<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Event;
use App\Models\EventInstance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

readonly class MyAttendeeEventsQuery
{
    /**
     * Get all events where the authenticated user is an attendee (by email in guests JSON).
     * Optionally filters out events that already have an EventInstance in the target pulse.
     * Used by the Pulse Manager modal to let users pick which meetings to add.
     */
    public function __invoke($rootValue, array $args): array
    {
        $user = Auth::user();

        $emptyResponse = fn (int $perPage) => [
            'data'          => [],
            'paginatorInfo' => [
                'count'        => 0,
                'currentPage'  => 1,
                'firstItem'    => null,
                'hasMorePages' => false,
                'lastItem'     => null,
                'lastPage'     => 1,
                'perPage'      => $perPage,
                'total'        => 0,
            ],
        ];

        if (! $user) {
            return $emptyResponse($args['perPage'] ?? 20);
        }

        $organizationId = $args['organizationId'];
        $pulseId        = $args['pulseId'] ?? null;
        $from           = $args['from'] ?? null;
        $to             = $args['to'] ?? null;
        $search         = $args['search'] ?? null;
        $page           = $args['page'] ?? 1;
        $perPage        = $args['perPage'] ?? 20;

        $userEmail = $user->email;

        if (! $userEmail) {
            return $emptyResponse($perPage);
        }

        $query = Event::query()
            ->with([
                'pulse',
                'user',
                'organization',
                'eventInstances',
                'attendees.user',
            ])
            ->where('organization_id', $organizationId)
            ->where(function ($q) use ($userEmail, $user) {
                // Match by organizer email (consistent with EventInstancesQuery / PaginatedEventInstancesQuery)
                $q->where('google_cal_organizer', $userEmail)
                    // Or match by email in the guests JSON array
                    ->orWhereJsonContains('guests', $userEmail)
                    // Or match by Attendee relationship
                    ->orWhereHas('attendees', function ($aq) use ($user) {
                        $aq->where('user_id', $user->id);
                    });
            })
            ->orderBy('start_at', 'asc');

        // Default date range: now to +3 months
        if ($from) {
            $query->where('start_at', '>=', Carbon::parse($from));
        } else {
            $query->where('start_at', '>=', Carbon::now());
        }

        if ($to) {
            $query->where('start_at', '<', Carbon::parse($to));
        } else {
            $query->where('start_at', '<', Carbon::now()->addMonths(3));
        }

        // Exclude events that already have an EventInstance in the target pulse
        if ($pulseId) {
            $query->whereDoesntHave('eventInstances', function ($q) use ($pulseId) {
                $q->where('pulse_id', $pulseId);
            });
        }

        if ($search) {
            $query->where('name', 'ilike', '%' . $search . '%');
        }

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data'          => $paginated->items(),
            'paginatorInfo' => [
                'count'        => $paginated->count(),
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
}
