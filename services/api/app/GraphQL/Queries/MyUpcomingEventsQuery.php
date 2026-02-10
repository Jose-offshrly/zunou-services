<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

readonly class MyUpcomingEventsQuery
{
    /**
     * Get all upcoming events that the current user can access across all pulses.
     * Returns events where user is a member of the pulse, ordered by start_at ascending.
     *
     * @param  mixed  $rootValue
     * @param  array  $args
     * @return array
     */
    public function __invoke($rootValue, array $args): array
    {
        $user = Auth::user();

        if (! $user) {
            return [
                'data' => [],
                'paginatorInfo' => [
                    'count' => 0,
                    'currentPage' => 1,
                    'firstItem' => null,
                    'hasMorePages' => false,
                    'lastItem' => null,
                    'lastPage' => 1,
                    'perPage' => $args['perPage'] ?? 20,
                    'total' => 0,
                ],
            ];
        }

        $organizationId = $args['organizationId'];
        $from = $args['from'] ?? null;
        $to = $args['to'] ?? null;
        $search = $args['search'] ?? null;
        $page = $args['page'] ?? 1;
        $perPage = $args['perPage'] ?? 20;

        // Get all pulse IDs the user is a member of in this organization
        $userPulseIds = $user->pulseMemberships()
            ->whereHas('pulse', function ($query) use ($organizationId) {
                $query->where('organization_id', $organizationId);
            })
            ->pluck('pulse_id');

        $query = Event::query()
            ->with([
                'pulse',
                'user',
                'organization',
                'meetingSession.dataSource',
                'attendees.user',
            ])
            ->where('organization_id', $organizationId)
            ->whereIn('pulse_id', $userPulseIds)
            ->orderBy('start_at', 'asc');

        // Apply date filters
        if ($from) {
            $query->where('start_at', '>=', Carbon::parse($from));
        } else {
            // Default: from now onwards
            $query->where('start_at', '>=', Carbon::now());
        }

        if ($to) {
            $query->where('start_at', '<', Carbon::parse($to));
        }

        // Apply search filter
        if ($search) {
            $query->where('name', 'ilike', '%' . $search . '%');
        }

        // Paginate
        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginated->items(),
            'paginatorInfo' => [
                'count' => $paginated->count(),
                'currentPage' => $paginated->currentPage(),
                'firstItem' => $paginated->firstItem(),
                'hasMorePages' => $paginated->hasMorePages(),
                'lastItem' => $paginated->lastItem(),
                'lastPage' => $paginated->lastPage(),
                'perPage' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ];
    }
}
