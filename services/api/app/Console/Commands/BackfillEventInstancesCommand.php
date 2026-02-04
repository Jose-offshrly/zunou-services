<?php

namespace App\Console\Commands;

use App\Jobs\BackfillEventInstancesChunk;
use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Command to backfill EventInstance records for Events that don't have them.
 *
 * This command queries all events without associated event instances and dispatches
 * chunk jobs (500 events per chunk) to create the missing EventInstance records.
 * Each chunk is processed as a separate queued job for better performance and reliability.
 */
class BackfillEventInstancesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:backfill-instances';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill event instances for events without instances';

    /**
     * Execute the console command.
     *
     * Chunks events without instances into batches of 500 and dispatches
     * BackfillEventInstancesChunk jobs to process each batch on the queue.
     *
     * @return int Command exit code (0 for success)
     */
    public function handle()
    {
        $this->info('Starting event instances backfill for events without instances...');

        $totalEventsDispatched = 0;

        Event::whereDoesntHave('eventInstances')
            ->chunk(500, function ($events) use (&$totalEventsDispatched) {
                $payload = $events->map(function ($event) {
                    return [
                        'id' => $event->id,
                        'pulse_id' => $event->pulse_id,
                        'priority' => $event->priority ?? null,
                    ];
                })->toArray();

                // Dispatch a job to process this chunk
                BackfillEventInstancesChunk::dispatch($payload);

                $totalEventsDispatched += count($payload);

                $this->info("Dispatched chunk job for " . count($payload) . " events (total: {$totalEventsDispatched})");

                if ($totalEventsDispatched % 500 === 0) {
                    Log::info("Dispatched chunks for {$totalEventsDispatched} events");
                }
            });

        $this->info("Event instances backfill dispatched for {$totalEventsDispatched} events. Use 'php artisan queue:work' to process chunk jobs.");
        
        Log::info('Event instances backfill dispatched', [
            'total_events_dispatched' => $totalEventsDispatched,
        ]);

        return 0;
    }
}
