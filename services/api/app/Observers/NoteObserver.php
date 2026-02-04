<?php

namespace App\Observers;

use App\Models\Note;

class NoteObserver
{
    /**
     * Handle the Note "created" event.
     */
    public function created(Note $note): void
    {
        // Set the position to the current max + 1 within the same pinned status (pinned and unpinned have separate order)
        $query = Note::query();
        if (! empty($note->pulse_id)) {
            $query->where('pulse_id', $note->pulse_id);
        }
        if (! empty($note->organization_id)) {
            $query->where('organization_id', $note->organization_id);
        }
        // Filter by pinned status
        $query->where('pinned', $note->pinned);
        $note->position = $query->max('position') + 1;
        $note->save();
    }
}
