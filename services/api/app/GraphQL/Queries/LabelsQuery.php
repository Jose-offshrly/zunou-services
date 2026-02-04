<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Enums\PulseCategory;
use App\Models\Label;
use App\Models\Pulse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class LabelsQuery
{
    public function __invoke($rootValue, array $args): Collection
    {
        $pulseId = $args['pulse_id'] ?? ($args['pulseId'] ?? null);

        if (!$pulseId) {
            return collect([]);
        }

        $viewAll = (bool) ($args['viewAll'] ?? false);
        $baseLabels = Label::query()->forPulse($pulseId)->pluck('id');

        // Helper function to load labels with optimized pulse counts
        $loadLabelsWithOptimizedPulse = function ($labelIds) {
            return Label::whereIn('id', $labelIds)
                ->with([
                    'pulse' => function ($query) {
                        $query->withCount([
                            'members',
                            'notifications as unread_notifications_count' => function (
                                $q
                            ) {
                                $q->where('status', 'pending');
                            },
                        ]);
                    },
                    'pulse.members',
                ])
                ->get();
        };

        $user = Auth::user();
        if (!$user) {
            return $loadLabelsWithOptimizedPulse($baseLabels);
        }

        // When viewAll is false or null, only return labels for this pulse.
        if (!$viewAll) {
            return $loadLabelsWithOptimizedPulse($baseLabels);
        }

        // viewAll is true: return all labels from all pulses where the user has notes.
        $noteLabels = Label::query()
            ->whereHas('notes', function ($query) use ($user) {
                $query->where('notes.user_id', $user->id);
            })
            ->pluck('id');

        $labelIds = $baseLabels->merge($noteLabels)->unique()->values();

        if ($labelIds->isEmpty()) {
            return collect([]);
        }

        return $loadLabelsWithOptimizedPulse($labelIds);
    }
}
