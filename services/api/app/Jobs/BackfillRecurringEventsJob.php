<?php

namespace App\Jobs;

use App\Models\Event;
use App\Models\EventInstance;
use App\Models\RecurringEvent;
use App\Models\RecurringEventInstanceSetup;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to backfill recurring_events records for existing events.
 *
 * This job processes events in chunks to avoid overloading the database.
 * It identifies recurring events by their google_event_id pattern (containing '_'),
 * groups them by their base ID, and creates RecurringEvent records for groups
 * that don't have one yet.
 */
class BackfillRecurringEventsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * The chunk size for processing events.
     *
     * @var int
     */
    protected $chunkSize;

    /**
     * Create a new job instance.
     *
     * @param int $chunkSize Number of events to process in this chunk
     */
    public function __construct(int $chunkSize = 500)
    {
        $this->chunkSize = $chunkSize;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(): void
    {
        Log::info('Starting backfill of recurring events', [
            'chunk_size' => $this->chunkSize,
        ]);

        // Always query from offset 0. Processed events drop out of the whereNull filter,
        // so the "next batch" is always the first N rows of the remaining unprocessed set.
        // A fixed offset into a shrinking dataset would skip rows on every subsequent chunk.
        $events = Event::whereNotNull('google_event_id')
            ->whereNull('recurring_event_id')
            ->whereNull('deleted_at')
            ->whereRaw("google_event_id ~ ?", ['_\d{8}(T\d{6}Z)?$'])
            ->take($this->chunkSize)
            ->get(['id', 'google_event_id', 'organization_id']);

        if ($events->isEmpty()) {
            Log::info('No more events to backfill');
            return;
        }

        Log::info('Processing events chunk', [
            'count' => $events->count(),
        ]);

        $recurringEventsCreated = 0;

        // Collect unique base IDs so we issue one firstOrCreate per series
        // instead of one per event in the chunk.
        $baseIds = [];
        foreach ($events as $event) {
            $baseId = $this->resolveBaseId($event);
            if ($baseId === null) {
                Log::warning('Could not determine series base ID — skipping event', [
                    'event_id'        => $event->id,
                    'google_event_id' => $event->google_event_id,
                ]);
                continue;
            }
            $baseIds[$baseId] = true;
        }

        foreach (array_keys($baseIds) as $baseId) {
            try {
                $this->processSeries($baseId, $recurringEventsCreated);
            } catch (\Exception $e) {
                Log::error('Failed to process recurring event series', [
                    'base_id' => $baseId,
                    'error'   => $e->getMessage(),
                    'trace'   => $e->getTraceAsString(),
                ]);
            }
        }

        Log::info('Completed chunk backfill', [
            'events_processed'         => $events->count(),
            'recurring_events_created' => $recurringEventsCreated,
        ]);

        // Dispatch the next chunk if we filled a full chunk; there may be more remaining.
        if ($events->count() === $this->chunkSize) {
            Log::info('Dispatching next chunk');
            self::dispatch($this->chunkSize);
        } else {
            Log::info('Backfill complete - processed last chunk', [
                'final_count' => $events->count(),
            ]);
        }
    }

    /**
     * Get-or-create the RecurringEvent row for a series, then bulk-link all
     * unlinked instances of that series.
     */
    private function processSeries(string $baseId, int &$recurringEventsCreated): void
    {
        // Atomically get or create the series row. firstOrCreate still does a
        // SELECT then INSERT, so concurrent runs can race on the unique constraint.
        // Catching SQLSTATE 23000 and re-fetching avoids both the orphan and the
        // aborted-transaction problem that would occur inside a DB::transaction.
        try {
            $recurringEvent = RecurringEvent::firstOrCreate(
                ['google_parent_id' => $baseId]
            );
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() !== '23000') {
                throw $e;
            }
            // Another run won the race — fetch the row it created.
            $recurringEvent = RecurringEvent::where('google_parent_id', $baseId)->firstOrFail();
        }

        if ($recurringEvent->wasRecentlyCreated) {
            $recurringEventsCreated++;
        }

        // Bulk-link every unlinked instance of this series in one query so the
        // whole series is consistent, not just the event that triggered this iteration.
        $linkedCount = Event::where('google_event_id', 'like', $baseId . '_%')
            ->whereNull('recurring_event_id')
            ->whereNull('deleted_at')
            ->update(['recurring_event_id' => $recurringEvent->id]);

        Log::info('Linked recurring event series', [
            'base_id'            => $baseId,
            'recurring_event_id' => $recurringEvent->id,
            'was_created'        => $recurringEvent->wasRecentlyCreated,
            'linked_count'       => $linkedCount,
        ]);

        $this->createInstanceSetups($recurringEvent->id);
    }

    /**
     * Ensure a RecurringEventInstanceSetup exists for every pulse that has
     * at least one EventInstance belonging to this recurring series.
     */
    private function createInstanceSetups(string $recurringEventId): void
    {
        $pulseIds = EventInstance::whereHas('event', function ($q) use ($recurringEventId) {
            $q->where('recurring_event_id', $recurringEventId);
        })->distinct()->pluck('pulse_id');

        foreach ($pulseIds as $pulseId) {
            try {
                RecurringEventInstanceSetup::firstOrCreate(
                    [
                        'recurring_event_id' => $recurringEventId,
                        'pulse_id'           => $pulseId,
                    ],
                    [
                        'invite_notetaker' => true,
                    ]
                );
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() !== '23000') {
                    throw $e;
                }
                // Race condition — row already exists, nothing to do.
            }
        }

        Log::info('Ensured recurring event instance setups', [
            'recurring_event_id' => $recurringEventId,
            'pulse_count'        => $pulseIds->count(),
        ]);
    }

    /**
     * Extract the series base ID from a google_event_id that matches the
     * timed (baseId_YYYYMMDDTHHMMSSZ) or all-day (baseId_YYYYMMDD) pattern.
     */
    private function resolveBaseId(Event $event): ?string
    {
        if (preg_match('/^(.+)_\d{8}(?:T\d{6}Z)?$/', $event->google_event_id ?? '', $matches)) {
            return $matches[1];
        }

        return null;
    }
}
