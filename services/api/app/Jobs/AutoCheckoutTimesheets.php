<?php

namespace App\Jobs;

use App\Models\Timesheet;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class AutoCheckoutTimesheets implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    public function handle()
    {
        $users = User::whereNotNull('timezone')->get();

        foreach ($users as $user) {
            $nowInUserTz = Carbon::now($user->timezone);

            if ($nowInUserTz->format('H:i') === '23:59') {
                $utcNow = Carbon::now('UTC');

                $incompleteTimesheets = Timesheet::where('user_id', $user->id)
                    ->whereNull('checked_out_at')
                    ->get();

                foreach ($incompleteTimesheets as $timesheet) {
                    $checkedOutAt = $utcNow;
                    $total        = $this->calculateTotalTime(
                        $timesheet,
                        $checkedOutAt,
                    );

                    // Update existing timesheet
                    $timesheet->update([
                        'checked_out_at' => $checkedOutAt,
                        'total'          => $total,
                    ]);

                    Log::info(
                        "Auto-stopped timesheet ID {$timesheet->id} for user {$user->id}",
                    );

                    // Start new one at midnight in user's timezone, convert to UTC
                    $nextDayStartInTz = $nowInUserTz
                        ->copy()
                        ->addMinute()
                        ->startOfDay(); // 00:00 next day
                    $nextDayStartUtc = $nextDayStartInTz
                        ->copy()
                        ->timezone('UTC');

                    Timesheet::create([
                        'user_id'       => $user->id,
                        'checked_in_at' => $nextDayStartUtc,
                        // 'total' => 0 — optional
                    ]);

                    Log::info(
                        "Started new timesheet for user {$user->id} at {$nextDayStartUtc} UTC",
                    );
                }
            }
        }
    }

    private function calculateTotalTime(
        Timesheet $timesheet,
        Carbon $checkout,
    ): string {
        $currentTotal          = (float) ($timesheet->total ?? 0);
        $currentSessionSeconds = $timesheet->checked_in_at->diffInSeconds(
            $checkout,
            false,
        );
        $currentSessionHours = $currentSessionSeconds / 3600;
        $totalHours          = $currentTotal + $currentSessionHours;

        return number_format($totalHours, 4, '.', '');
    }
}
