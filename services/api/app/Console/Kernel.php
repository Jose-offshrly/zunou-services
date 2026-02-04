<?php

namespace App\Console;

use App\Jobs\AutoCheckoutTimesheets;
use App\Jobs\CleanMeetingSessionsJob;
use App\Jobs\CleanupFailedDataSourcesJob;
use App\Jobs\FetchGoogleCalendarEventsJob;
use App\Jobs\LiveInsightsWorkerJob;
use App\Jobs\PreGenerateScoutRemindersJob;
use App\Jobs\TranscriptQueueWorkerJob;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        if (app()->environment('production')) {
            $schedule->command('fireflies:fetch-meetings')->everySixHours();
        } elseif (app()->environment('staging')) {
            $schedule->command('fireflies:fetch-meetings')->daily();
        } else {
            // Do not schedule the command for other environments
            // No scheduling for local, testing, etc.
        }

        $schedule->command('meeting-session:update')->everyMinute();

        $schedule->command('google:setup-webhooks')->daily(); // Renew webhooks weekly (they expire after 7 days, renewed if expiring within 2 days)
        $schedule->command('tasks:update-overdue')->daily();
        $schedule->command('users:process-deleted')->weekly();

        $schedule
            ->command('app:run-automations')
            ->everyMinute()
            ->withoutOverlapping();

        $schedule
            ->command('app:run-scheduled-job')
            ->everyMinute()
            ->withoutOverlapping();

        $schedule->job(new TranscriptQueueWorkerJob())->everyTwentySeconds();
        $schedule->job(new AutoCheckoutTimesheets())->hourly();
        // $schedule->job(new CleanMeetingSessionsJob())->everyTwentySeconds();
        $schedule->job(new FetchGoogleCalendarEventsJob())->hourly();
        $schedule->job(new CleanupFailedDataSourcesJob())->hourly();
        $schedule->job(new LiveInsightsWorkerJob())->everyMinute();

        // Pre-generate scout reminders every morning at 6 AM
        // $schedule->job(new PreGenerateScoutRemindersJob())->dailyAt('06:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }

    protected $commands = [
        // ... existing code ...
        \App\Console\Commands\CreatePersonalPulse::class,
    ];
}
