<?php

namespace App\Observers;

use App\Models\Checklist;

class ChecklistObserver
{
    /**
     * Handle the Checklist "creating" event.
     * Sets the position to the next available position within the same event or pulse.
     */
    public function creating(Checklist $checklist): void
    {
        // Only set position if it's not already set
        if (is_null($checklist->position)) {
            $query = Checklist::query();

            // Group by event_id if available, otherwise by pulse_id and organization_id
            if ($checklist->event_id) {
                $query->where('event_id', $checklist->event_id);
            } else {
                $query
                    ->where('pulse_id', $checklist->pulse_id)
                    ->where('organization_id', $checklist->organization_id);
            }

            $maxPosition         = $query->max('position') ?? 0;
            $checklist->position = $maxPosition + 1;
        }
    }
}
