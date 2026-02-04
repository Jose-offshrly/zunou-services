<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Enums\PulseCategory;
use App\Models\Note;
use Illuminate\Support\Facades\Auth;

class NoteQuery
{
    public function __invoke($rootValue, array $args): ?Note
    {
        $noteId = $args['noteId'] ?? $args['id'] ?? null;
        $viewAllLabels = (bool) ($args['viewAllLabels'] ?? false);
        
        if (! $noteId) {
            return null;
        }
        
        // Get note with labels and pulse relationships, using withCount for efficient count queries
        $note = Note::with([
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
        ])->find($noteId);
        
        if (! $note) {
            return null;
        }
        
        // If viewAllLabels is true, show all labels (no filtering)
        if ($viewAllLabels) {
            return $note;
        }
        
        // Check if the note's pulse is a personal pulse
        $isPersonalPulse = false;
        if ($note->pulse) {
            $isPersonalPulse = $note->pulse->category === PulseCategory::PERSONAL;
            
            // Also verify the user is a member of this personal pulse
            if ($isPersonalPulse) {
                $user = Auth::user();
                if ($user && ! $note->pulse->members()->where('user_id', $user->id)->exists()) {
                    $isPersonalPulse = false;
                }
            }
        }
        
        // Filter labels based on pulse context
        if (! $isPersonalPulse && $note->relationLoaded('labels')) {
            // If not in personal pulse, filter out labels from personal pulses
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
        // If in personal pulse, show all labels (no filtering needed)
        
        return $note;
    }
}

