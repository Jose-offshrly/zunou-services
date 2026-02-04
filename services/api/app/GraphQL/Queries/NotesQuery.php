<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Enums\PulseCategory;
use App\Models\Note;
use App\Models\Pulse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class NotesQuery
{
    public function __invoke($rootValue, array $args): Collection
    {
        $pulseId = $args['pulse_id'] ?? null;
        $viewAllLabels = (bool) ($args['viewAllLabels'] ?? false);
        
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
        
        // Get notes with labels and pulse relationships, using withCount for efficient count queries
        $notes = $query->with([
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
        ])->get();
        
        // If viewAllLabels is true, show all labels (no filtering)
        if ($viewAllLabels) {
            return $notes;
        }
        
        // Determine if we're viewing from a personal pulse
        $isViewingFromPersonalPulse = false;
        if ($pulseId) {
            $viewingPulse = Pulse::find($pulseId);
            if ($viewingPulse && $viewingPulse->category === PulseCategory::PERSONAL) {
                $user = Auth::user();
                if ($user && $viewingPulse->members()->where('user_id', $user->id)->exists()) {
                    $isViewingFromPersonalPulse = true;
                }
            }
        }
        
        // Filter labels based on viewing context
        if (! $isViewingFromPersonalPulse) {
            // If not viewing from personal pulse, filter out labels from personal pulses
            $notes->each(function (Note $note) {
                if ($note->relationLoaded('labels')) {
                    $filteredLabels = $note->labels->filter(function ($label) {
                        // If label has no pulse, include it (edge case)
                        if (! $label->pulse) {
                            return true;
                        }
                        
                        // Exclude labels that belong to personal pulses
                        return $label->pulse->category !== PulseCategory::PERSONAL;
                    })->values();
                    
                    // Replace the labels collection
                    $note->setRelation('labels', $filteredLabels);
                }
            });
        }
        // If viewing from personal pulse, show all labels (no filtering needed)
        
        return $notes;
    }
}

