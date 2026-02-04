<?php

namespace App\GraphQL\Mutations;

use App\Models\Timesheet;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class CheckOutMutation
{
    /**
     * @throws Error
     */
    public function __invoke($_, array $args): Timesheet
    {
        $user = Auth::user();
        if (!$user) {
            throw new Error('No user was found');
        }

        $activeTimeSheet = $this->getActiveTimesheet(user_id: $user->id);

        $activeTimeSheet->update([
            'checked_out_at' => now(),
        ]);

        return $activeTimeSheet->refresh();
    }

    private function getActiveTimesheet(string $user_id): Timesheet
    {
        $timesheet = TimeSheet::forUser($user_id)
            ->whereNull('checked_out_at')
            ->first();

        if (!$timesheet) {
            throw new Error('No active time sheet found');
        }

        return $timesheet;
    }
}
