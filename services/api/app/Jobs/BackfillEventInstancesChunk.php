<?php

namespace App\Jobs;

use App\Models\EventInstance;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Job to process a chunk of events and create missing EventInstance records.
 *
 * This job receives a payload containing event data (id, pulse_id, priority)
 * and creates EventInstance records for each event. Events without a pulse_id
 * are skipped and logged. The job processes events in database transactions
 * and logs the results upon completion.
 */
class BackfillEventInstancesChunk implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Array of event data to process. Each element contains:
     * - id: Event ID
     * - pulse_id: Associated Pulse ID
     * - priority: Event priority (nullable)
     *
     * @var array<int, array{id: string, pulse_id: string|null, priority: string|null}>
     */
    protected $eventsData;

    /**
     * Create a new job instance.
     *
     * @param array<int, array{id: string, pulse_id: string|null, priority: string|null}> $eventsData Array of event data
     */
    public function __construct(array $eventsData)
    {
        $this->eventsData = $eventsData;
    }

    /**
     * Execute the job.
     *
     * Iterates through the event data and creates EventInstance records
     * within database transactions. Skips events without pulse_id and
     * logs detailed information about the processing results.
     *
     * @return void
     */
    public function handle(): void
    {
        $totalInstancesCreated = 0;
        $skippedEvents = 0;

        foreach ($this->eventsData as $eventData) {
            DB::transaction(function () use ($eventData, &$totalInstancesCreated, &$skippedEvents) {
                // Verify the event has a pulse_id
                if (! ($eventData['pulse_id'] ?? null)) {
                    Log::warning('Skipping event without pulse_id', [
                        'event_id' => $eventData['id'],
                    ]);
                    $skippedEvents++;

                    return;
                }

                // Create an event instance for this event
                EventInstance::create([
                    'id'                => (string) Str::uuid(),
                    'event_id'          => $eventData['id'],
                    'pulse_id'          => $eventData['pulse_id'],
                    'local_description' => null,
                    'priority'          => $eventData['priority'] ?? null,
                ]);

                $totalInstancesCreated++;

                Log::debug('Created event instance', [
                    'event_id' => $eventData['id'],
                    'pulse_id' => $eventData['pulse_id'],
                ]);
            });
        }

        Log::info('Processed backfill chunk', [
            'events_in_chunk'    => count($this->eventsData),
            'instances_created'  => $totalInstancesCreated,
            'skipped_events'     => $skippedEvents,
        ]);
    }
}
