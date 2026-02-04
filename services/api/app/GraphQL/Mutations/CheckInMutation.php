<?php

namespace App\GraphQL\Mutations;

use App\Models\Timesheet;
use App\Models\User;
use GraphQL\Error\Error;

class CheckInMutation
{
    /**
     * @throws Error
     * @throws \Exception
     */
    public function __invoke($_, array $args): Timesheet
    {
        $user = auth()->user();
        if (!$user) {
            throw new Error('No user was found');
        }

        $this->checkRunningTimesheet($user);

        $timesheet = Timesheet::create([
            'user_id' => $user->id,
            'checked_in_at' => now(),
        ]);

        return $timesheet->refresh();
    }

    private function checkRunningTimesheet(User $user): ?Timesheet
    {
        // Get the latest timesheet for today, whether checked out or not
        $todayTimeSheet = TimeSheet::forUser($user->id)
            ->whereDate('checked_in_at', today())
            ->latest('checked_in_at')
            ->first();

        if ($todayTimeSheet && is_null($todayTimeSheet->checked_out_at)) {
            throw new \Error(
                'You have an active timesheet that needs to be checked out first'
            );
        }

        return $todayTimeSheet;
    }
}
