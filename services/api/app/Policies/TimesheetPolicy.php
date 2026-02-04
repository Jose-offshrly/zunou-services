<?php

namespace App\Policies;

use App\Models\Timesheet;
use App\Models\User;

class TimesheetPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:timesheets');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        Timesheet $timesheet = null,
    ): bool {
        $timesheet = $this->loadModel(
            $user,
            $args,
            Timesheet::class,
            $timesheet,
        );
        if (! $timesheet) {
            return false;
        }

        return ($timesheet && $user->id === $timesheet->user_id && $user->hasPermission('read:timesheets')) || $user->hasPermission('admin:timesheets');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        // Ensure the user has the 'create:timesheets' permission
        // and that they are creating a timesheet for their own user ID
        return $user && $user->hasPermission('create:timesheets');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args): bool
    {
        $timesheet = TimeSheet::query()
            ->where('user_id', $user->id)
            ->whereNull('checked_out_at')
            ->first();
        if (! $timesheet) {
            return false;
        }

        return $user->id === $timesheet->user_id && $user->hasPermission('update:timesheets');
    }
}
