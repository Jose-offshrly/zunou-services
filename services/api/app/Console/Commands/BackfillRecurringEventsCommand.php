<?php

namespace App\Console\Commands;

use App\Jobs\BackfillRecurringEventsJob;
use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Command to backfill RecurringEvent records for existing events.
 *
 * This command identifies events that are part of a recurring series
 * (have '_' in google_event_id) but don't have a recurring_event_id yet,
 * and dispatches chunk jobs to create the missing RecurringEvent records
 * and link the events to them.
 */
class BackfillRecurringEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:backfill-recurring
                            {--chunk-size=500 : Number of events to process per chunk}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill recurring_events records for existing events';

    /**
     * Execute the console command.
     *
     * @return int Command exit code (0 for success)
     */
    public function handle()
    {
        $chunkSize = (int) $this->option('chunk-size');

        $this->info('Dispatching recurring events backfill job...');

        // Dispatch the first chunk - subsequent chunks will be dispatched automatically
        BackfillRecurringEventsJob::dispatch($chunkSize);

        $this->info("✓ Backfill job dispatched with chunk size of {$chunkSize}.");
        $this->info("Use 'php artisan queue:work' to process the jobs.");
        $this->info("Monitor progress: tail -f storage/logs/laravel.log | grep 'recurring'");

        Log::info('Recurring events backfill job dispatched', [
            'chunk_size' => $chunkSize,
        ]);

        return 0;
    }
}
