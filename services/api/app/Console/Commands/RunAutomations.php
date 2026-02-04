<?php

namespace App\Console\Commands;

use App\Jobs\ProcessAutomationJob;
use App\Models\Automation;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class RunAutomations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:run-automations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Automation::where('next_run_at', '<=', Carbon::now())
            ->where('on_queue', true)
            ->each(function (Automation $automation) {
                // Turn off on_queue before running the automation
                $automation->on_queue = false;
                $automation->save();

                ProcessAutomationJob::dispatch(
                    $automation->id,
                    true,
                    null,
                )->onQueue('default');
            });
    }
}
