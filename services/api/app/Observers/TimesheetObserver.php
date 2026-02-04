<?php

namespace App\Observers;

use App\Enums\UserPresence;
use App\Models\Timesheet;

class TimesheetObserver
{
    /**
     * Handle the Timesheet "created" event.
     */
    public function created(Timesheet $timesheet): void
    {
        $user = auth()->user();

        $user->presence = UserPresence::active->value;
        $user->save();
    }

    /**
     * Handle the Timesheet "updated" event.
     */
    public function updated(Timesheet $timesheet): void
    {
        if (isset($timesheet->checked_out_at)) {
            $user = auth()->user();

            $user->presence = UserPresence::offline->value;
            $user->save();
        }
    }
}
