<?php

namespace App\Console\Commands;

use App\Jobs\ProcessAutomationJob;
use App\Models\Automation;
use App\Models\ScheduledJob;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class RunScheduledJob extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:run-scheduled-job';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run a scheduled job';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Log::info('Running scheduled job');
        ScheduledJob::where('next_run_at', '<=', Carbon::now())
            ->where('on_queue', true)
            ->each(function (ScheduledJob $scheduledJob) {
                // Turn off on_queue before running the scheduled job
                Log::debug('Running scheduled job', ['scheduledJob' => $scheduledJob]);
                $scheduledJob->on_queue = false;
                $scheduledJob->save();

                $jobClass = $scheduledJob->job_class;
                $payload = $scheduledJob->payload;

                $jobClass::dispatch($payload)->onQueue('default');
            });
    }
}
