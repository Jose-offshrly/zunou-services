<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class ProcessGoogleCalendarWebhookItemsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of items to process per chunk.
     */
    public const CHUNK_SIZE = 50;

    /**
     * Number of weeks in the past to sync recurring events.
     */
    public const SYNC_WEEKS_PAST = 1;

    /**
     * Number of weeks in the future to sync recurring events.
     */
    public const SYNC_WEEKS_FUTURE = 13;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $userId,
        public array $items,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = $this->resolveUser();
        if (! $user) {
            return;
        }

        $this->logJobStart($user);

        // Filter and deduplicate items to prevent processing duplicates
        // Items already contain recurring event instances from delta sync
        $filteredItems = $this->filterAndDeduplicateItems($this->items);

        Log::info('ProcessGoogleCalendarWebhookItemsJob: Filtered items', [
            'user_id'        => $user->id,
            'original_count' => count($this->items),
            'filtered_count' => count($filteredItems),
        ]);

        // Chunk the filtered items and dispatch background jobs
        $chunks      = array_chunk($filteredItems, self::CHUNK_SIZE);
        $totalChunks = count($chunks);

        Log::info('ProcessGoogleCalendarWebhookItemsJob: Dispatching chunk jobs', [
            'user_id'        => $user->id,
            'filtered_count' => count($filteredItems),
            'chunk_size'     => self::CHUNK_SIZE,
            'total_chunks'   => $totalChunks,
        ]);

        // Process the first chunk immediately for live updates (the event that triggered the webhook)
        if (! empty($chunks)) {
            $firstChunk = array_shift($chunks);
            $totalChunks = count($chunks) + 1; // Update total after removing first chunk

            Log::info('ProcessGoogleCalendarWebhookItemsJob: Processing first chunk immediately for live update', [
                'user_id'        => $user->id,
                'first_chunk_size' => count($firstChunk),
                'remaining_chunks' => count($chunks),
            ]);

            // Process first chunk synchronously for immediate update
            $firstChunkJob = new ProcessGoogleCalendarWebhookItemsChunkJob(
                userId: $this->userId,
                items: $firstChunk,
                chunkIndex: 1,
                totalChunks: $totalChunks,
            );
            $firstChunkJob->handle(
                app(\App\Actions\Event\CreateSourcedEventAction::class),
                app(\App\Actions\Event\CreateEventOwnerAction::class),
                app(\App\Actions\Event\CreateEventInstanceAction::class),
            );
        }

        // Dispatch remaining chunks asynchronously
        foreach ($chunks as $index => $chunk) {
            ProcessGoogleCalendarWebhookItemsChunkJob::dispatch(
                userId: $this->userId,
                items: $chunk,
                chunkIndex: $index + 2, // +2 because first chunk was index 1
                totalChunks: $totalChunks,
            );
        }

        $this->logJobCompleted($user);
    }

    /**
     * Resolve the user for this job.
     */
    private function resolveUser(): ?User
    {
        $user = User::find($this->userId);

        if (! $user) {
            Log::warning('ProcessGoogleCalendarWebhookItemsJob: User not found', [
                'user_id' => $this->userId,
            ]);
        }

        return $user;
    }

    private function logJobStart(User $user): void
    {
        Log::info('Processing Google Calendar webhook items in job', [
            'user_id'     => $user->id,
            'items_count' => count($this->items),
        ]);
    }

    private function logJobCompleted(User $user): void
    {
        Log::info('Completed processing Google Calendar webhook items in job', [
            'user_id'     => $user->id,
            'items_count' => count($this->items),
        ]);
    }

    /**
     * Extract the base event ID from a Google Calendar event ID.
     * For recurring events, the ID format is "baseId_timestamp" (e.g., "abc123_20260121T053000Z").
     * This method returns the base ID portion before the underscore.
     * For non-recurring events without an underscore, returns the full ID.
     */
    private function extractBaseEventId(string $googleEventId): string
    {
        // Check if the ID contains an underscore followed by a timestamp pattern
        if (str_contains($googleEventId, '_')) {
            $parts = explode('_', $googleEventId);

            // Return the first part (base ID)
            return $parts[0];
        }

        // No underscore, return the full ID
        return $googleEventId;
    }

    /**
     * Filter and deduplicate webhook items early to prevent processing too many recurring events.
     * - Filters out recurring events outside the sync window
     * - Deduplicates recurring events by base ID + date to prevent same-day duplicates
     */
    private function filterAndDeduplicateItems(array $items): array
    {
        // Calculate the sync window boundaries
        $windowStart = now()->subWeeks(self::SYNC_WEEKS_PAST)->startOfDay();
        $windowEnd   = now()->addWeeks(self::SYNC_WEEKS_FUTURE)->endOfDay();

        $seen     = [];
        $filtered = [];

        foreach ($items as $item) {
            $googleEventId = $item['id'] ?? null;

            if (! $googleEventId) {
                continue;
            }

            // Check if this is a recurring event (has underscore with timestamp)
            $isRecurring = str_contains($googleEventId, '_');

            if ($isRecurring) {
                // Extract date from the recurring event ID (e.g., "abc123_20260121T053000Z")
                $eventDate = $this->extractDateFromRecurringEventId($googleEventId);

                if ($eventDate) {
                    // Filter out events outside the sync window
                    if ($eventDate->lt($windowStart) || $eventDate->gt($windowEnd)) {
                        Log::debug('Filtering out recurring event outside sync window', [
                            'google_event_id' => $googleEventId,
                            'event_date'      => $eventDate->toDateString(),
                            'window_start'    => $windowStart->toDateString(),
                            'window_end'      => $windowEnd->toDateString(),
                        ]);

                        continue;
                    }

                    // Deduplicate by base ID + date to prevent same-day duplicates
                    $baseId    = $this->extractBaseEventId($googleEventId);
                    $dateKey   = $eventDate->format('Y-m-d');
                    $dedupeKey = $baseId.':'.$dateKey;

                    if (isset($seen[$dedupeKey])) {
                        Log::debug('Filtering out duplicate recurring event for same day', [
                            'google_event_id' => $googleEventId,
                            'dedupe_key'      => $dedupeKey,
                        ]);

                        continue;
                    }

                    $seen[$dedupeKey] = true;
                }
            }

            $filtered[] = $item;
        }

        return $filtered;
    }

    /**
     * Extract the date from a recurring event ID.
     * e.g., "abc123_20260121T053000Z" -> Carbon date for 2026-01-21
     */
    private function extractDateFromRecurringEventId(string $googleEventId): ?Carbon
    {
        if (! str_contains($googleEventId, '_')) {
            return null;
        }

        $parts = explode('_', $googleEventId);

        if (count($parts) < 2) {
            return null;
        }

        $timestamp = $parts[1];

        // Parse timestamp like "20260121T053000Z" or "20260121"
        try {
            // Remove the 'Z' suffix if present and parse
            $timestamp = str_replace('Z', '', $timestamp);

            if (strlen($timestamp) >= 8) {
                $dateStr = substr($timestamp, 0, 8); // "20260121"

                return Carbon::createFromFormat('Ymd', $dateStr);
            }
        } catch (\Exception $e) {
            Log::debug('Failed to parse date from recurring event ID', [
                'google_event_id' => $googleEventId,
                'timestamp'       => $timestamp,
                'error'           => $e->getMessage(),
            ]);
        }

        return null;
    }
}

