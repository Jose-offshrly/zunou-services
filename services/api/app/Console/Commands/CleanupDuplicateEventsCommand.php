<?php

namespace App\Console\Commands;

use App\Jobs\CleanupDuplicateEventsJob;
use Illuminate\Console\Command;

/**
 * Artisan command to dispatch the CleanupDuplicateEventsJob.
 *
 * Cleans up duplicate events created by the old per-user/per-pulse sync implementation
 * so that only one event per (organization_id, google_event_id) remains, and only one
 * event instance per (event_id, pulse_id) remains.
 *
 * Usage:
 *   php artisan events:cleanup-duplicates                # Execute the full cleanup
 *   php artisan events:cleanup-duplicates --dry-run      # Preview changes without modifying data
 *   php artisan events:cleanup-duplicates --phase=3      # Resume from phase 3 (e.g., after timeout)
 */
class CleanupDuplicateEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:cleanup-duplicates
        {--dry-run : Preview changes without modifying data}
        {--phase=1 : Phase to start from (1-4). Use to resume after a timeout.}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up duplicate events at org level and duplicate event instances at pulse level';

    /**
     * Execute the console command.
     *
     * Dispatches CleanupDuplicateEventsJob onto the queue with the dry-run flag
     * and optional start phase for manual resumption.
     *
     * @return void
     */
    public function handle(): void
    {
        $dryRun     = (bool) $this->option('dry-run');
        $startPhase = (int) $this->option('phase');

        if ($startPhase < 1 || $startPhase > 4) {
            $this->error('Phase must be between 1 and 4.');

            return;
        }

        if ($dryRun) {
            $this->info('Running in dry-run mode — no changes will be made.');
        }

        if ($startPhase > 1) {
            $this->info("Resuming from Phase {$startPhase}.");
        }

        $this->info('Dispatching CleanupDuplicateEventsJob...');

        CleanupDuplicateEventsJob::dispatch($dryRun, $startPhase);

        $this->info('CleanupDuplicateEventsJob dispatched successfully! Check logs for progress.');
    }
}
