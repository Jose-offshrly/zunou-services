<?php

namespace App\GraphQL\Queries;

use App\Models\LiveInsightOutbox;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

// no additional Lighthouse types needed for this resolver signature

class MyLiveInsightsQuery
{
    /**
     * Backwards-compatible invoker returning all results.
     * Note: Pagination should use the builder() method below with @paginate.
     */
    public function __invoke($_, array $args): Collection
    {
        return $this->builder($_, $args)->get();
    }

    /**
     * Provide a query builder for Lighthouse @paginate.
     */
    public function builder($_, array $args): Builder
    {
        $query = LiveInsightOutbox::query()
            ->with([
                'pulse.members.user',
                'meeting.meetingSession',
            ]);

        $args = is_array($args) ? $args : [];

        $userId = auth()->id();
        $query->where('user_id', $userId);

        $filter = $args['filter'] ?? [];

        // Filter by pulse_id if provided
        $pulseId = $filter['pulseId'] ?? ($filter['pulse_id'] ?? null);
        if ($pulseId) {
            $query->where('pulse_id', $pulseId);
        }

        $organizationId = $filter['organizationId'] ?? ($filter['organization_id'] ?? null);
        if ($organizationId) {
            $query->whereHas('pulse', function (Builder $subQuery) use (
                $organizationId
            ) {
                $subQuery->where('organization_id', $organizationId);
            });
        }

        // Handle multi-status filter: if statuses array is provided and not empty, filter by it
        // If empty array or not provided, don't filter by status (get all statuses)
        if (! empty($filter['statuses']) && is_array($filter['statuses'])) {
            $query->whereIn('delivery_status', $filter['statuses']);
        } elseif (! empty($filter['status'])) {
            // Backward compatibility: support single status filter
            $query->where('delivery_status', $filter['status']);
        }

        if (! empty($filter['type'])) {
            $query->where('type', $filter['type']);
        }

        if (! empty($filter['since'])) {
            $query->where('updated_at', '>=', $filter['since']);
        }

        if (! empty($filter['search'])) {
            $search = trim((string) $filter['search']);
            $query->where(function (Builder $subQuery) use ($search) {
                $subQuery
                    ->where('topic', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%")
                    ->orWhere('explanation', 'ilike', "%{$search}%");
            });
        }

        if (isset($filter['bookmarked'])) {
            $query->where('is_bookmarked', $filter['bookmarked']);
        }

        return $query;
    }

    /**
     * Paginate like PaginatedEvents (page/perPage + paginatorInfo).
     */
    public function paginate($_, array $args): array
    {
        $page    = isset($args['page']) ? max(1, (int) $args['page']) : 1;
        $perPage = isset($args['perPage'])
            ? max(1, (int) $args['perPage'])
            : 20;

        $paginator = $this->builder($_, $args)
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page', $page);

        return [
            'data'          => $paginator->items(),
            'paginatorInfo' => [
                'count'        => $paginator->count(),
                'currentPage'  => $paginator->currentPage(),
                'firstItem'    => $paginator->firstItem(),
                'hasMorePages' => $paginator->hasMorePages(),
                'lastItem'     => $paginator->lastItem(),
                'lastPage'     => $paginator->lastPage(),
                'perPage'      => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ];
    }
}
