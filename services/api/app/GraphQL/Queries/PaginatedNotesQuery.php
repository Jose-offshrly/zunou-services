<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Enums\PulseCategory;
use App\Models\Note;
use App\Models\Pulse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class PaginatedNotesQuery
{
    /**
     * Return paginated notes with paginator info, mirroring the EventsQuery style.
     */
    public function __invoke($rootValue, array $args): array
    {
        $pulseId = $args['pulse_id'] ?? null;
        $viewAllLabels = (bool) ($args['viewAllLabels'] ?? false);
        $page = $args['page'] ?? 1;
        $perPage = $args['perPage'] ?? 10;

        // Build the base query
        $query = Note::query();

        // Apply filters from args
        if (isset($args['organization_id'])) {
            $query->where('organization_id', $args['organization_id']);
        }

        if (isset($args['pulse_id'])) {
            $query->where('pulse_id', $args['pulse_id']);
        }

        if (isset($args['user_id'])) {
            $query->where('user_id', $args['user_id']);
        }

        if (isset($args['pinned'])) {
            $query->where('pinned', $args['pinned']);
        }

        if (isset($args['title'])) {
            $query->where('title', 'ILIKE', $args['title']);
        }

        if (isset($args['content'])) {
            $query->where('content', 'ILIKE', $args['content']);
        }

        // Order by position
        $query->orderBy('position');

        /** @var LengthAwarePaginator $paginatedNotes */
        $paginatedNotes = $query
            ->with([
                'labels.pulse' => function ($query) {
                    $query->withCount([
                        'members',
                        'notifications as unread_notifications_count' => function ($q) {
                            $q->where('status', 'pending');
                        },
                    ]);
                },
                'labels.pulse.members',
                'pulse',
                'files',
                'data_source',
            ])
            ->paginate($perPage, ['*'], 'page', $page);

        $notes = $paginatedNotes->getCollection();

        // If viewAllLabels is false, filter out labels from personal pulses when not viewing from a personal pulse
        if (!$viewAllLabels) {
            $isViewingFromPersonalPulse = false;
            if ($pulseId) {
                $viewingPulse = Pulse::find($pulseId);
                if (
                    $viewingPulse &&
                    $viewingPulse->category === PulseCategory::PERSONAL
                ) {
                    $user = Auth::user();
                    if (
                        $user &&
                        $viewingPulse
                            ->members()
                            ->where('user_id', $user->id)
                            ->exists()
                    ) {
                        $isViewingFromPersonalPulse = true;
                    }
                }
            }

            if (!$isViewingFromPersonalPulse) {
                $notes->each(function (Note $note) {
                    if ($note->relationLoaded('labels')) {
                        $filteredLabels = $note->labels
                            ->filter(function ($label) {
                                // If label has no pulse, include it (edge case)
                                if (!$label->pulse) {
                                    return true;
                                }

                                // Exclude labels that belong to personal pulses
                                return $label->pulse->category !==
                                    PulseCategory::PERSONAL;
                            })
                            ->values();

                        // Replace the labels collection
                        $note->setRelation('labels', $filteredLabels);
                    }
                });
            }
        }

        return [
            'data' => $notes->values(),
            'paginatorInfo' => [
                'count' => $paginatedNotes->count(),
                'currentPage' => $paginatedNotes->currentPage(),
                'firstItem' => $paginatedNotes->firstItem(),
                'hasMorePages' => $paginatedNotes->hasMorePages(),
                'lastItem' => $paginatedNotes->lastItem(),
                'lastPage' => $paginatedNotes->lastPage(),
                'perPage' => $paginatedNotes->perPage(),
                'total' => $paginatedNotes->total(),
            ],
        ];
    }
}
