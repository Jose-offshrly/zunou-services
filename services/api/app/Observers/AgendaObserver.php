<?php

namespace App\Observers;

use App\Models\Agenda;

class AgendaObserver
{
    /**
     * Handle the Agenda "creating" event.
     * Sets the position to the next available position within the same event or pulse.
     */
    public function creating(Agenda $agenda): void
    {
        // Only set position if it's not already set
        if (is_null($agenda->position)) {
            $query = Agenda::query();

            // Group by event_id if available, otherwise by pulse_id and organization_id
            if ($agenda->event_id) {
                $query->where('event_id', $agenda->event_id);
            } else {
                $query
                    ->where('pulse_id', $agenda->pulse_id)
                    ->where('organization_id', $agenda->organization_id);
            }

            $maxPosition      = $query->max('position') ?? 0;
            $agenda->position = $maxPosition + 1;
        }
    }
}
