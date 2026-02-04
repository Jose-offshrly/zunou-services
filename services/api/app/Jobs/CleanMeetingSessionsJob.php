<?php

namespace App\Jobs;

use App\Actions\MeetingSession\FetchCompanionStatusAction;
use App\Enums\MeetingSessionStatus;
use App\Models\MeetingSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CleanMeetingSessionsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 300;

    /**
     * Number of records to process per batch.
     */
    private const CHUNK_SIZE = 100;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Starting CleanMeetingSessionsJob - will clean sessions only when companion_details.status = "not_admitted" and end_at is past');

        try {
            $fetchAction = new FetchCompanionStatusAction();

            // Fetch recordings from companion API (single call)
            $response = $fetchAction->fetchRecordings();
            $recordingsMap = $fetchAction->buildRecordingsMap($response);

            Log::info('CleanMeetingSessionsJob fetched recordings', [
                'recordings_count' => $recordingsMap->count(),
            ]);

            // Build query for sessions (without executing)
            $query = $fetchAction->buildSessionsQuery($recordingsMap);

            $cleanedCount = 0;
            $processedCount = 0;
            $now = Carbon::now('UTC');

            // Process sessions in chunks to reduce memory usage
            $query->chunkById(self::CHUNK_SIZE, function ($sessions) use ($recordingsMap, $now, &$cleanedCount, &$processedCount) {
                foreach ($sessions as $meetingSession) {
                    $processedCount++;

                    // Attach companion details from recordings map
                    $meetingSession->companion_details = $recordingsMap->get($meetingSession->meeting_id);

                    // Log companion details if they exist for debugging
                    if ($meetingSession->companion_details) {
                        Log::info("Processing session {$meetingSession->id} with companion_details", [
                            'session_id'       => $meetingSession->id,
                            'companion_status' => $meetingSession->companion_details['status']         ?? 'not_set',
                            'meeting_status'   => $meetingSession->companion_details['meeting_status'] ?? 'not_set',
                        ]);
                    }

                    // Check if session should be cleaned
                    if ($this->shouldCleanSession($meetingSession, $now)) {
                        $this->cleanSession($meetingSession);
                        $cleanedCount++;
                    }
                }

                Log::info('CleanMeetingSessionsJob batch processed', [
                    'batch_size'      => $sessions->count(),
                    'total_processed' => $processedCount,
                    'total_cleaned'   => $cleanedCount,
                ]);
            });

            Log::info("CleanMeetingSessionsJob completed. Processed {$processedCount} sessions, cleaned {$cleanedCount}.");
        } catch (\Exception $e) {
            Log::error('CleanMeetingSessionsJob failed: '.$e->getMessage(), [
                'exception' => $e,
            ]);
            throw $e;
        }
    }

    /**
     * Determine if a meeting session should be cleaned.
     */
    private function shouldCleanSession(MeetingSession $meetingSession, Carbon $now): bool
    {
        // Only evaluate end_at when companion status is not_admitted
        $companionStatus = $meetingSession->companion_details['status'] ?? null;

        if ($companionStatus !== 'not_admitted') {
            return false;
        }

        // Check if session is past its end_at time (use raw DB value and convert to UTC Carbon)
        $rawEndAt = $meetingSession->getRawOriginal('end_at');
        if ($rawEndAt) {
            $endAtUtc = Carbon::parse((string) $rawEndAt);

            if ($endAtUtc->isPast()) {
                Log::info("Session {$meetingSession->id} is not_admitted and past end_at time", [
                    'session_id'       => $meetingSession->id,
                    'companion_status' => $companionStatus,
                    'end_at'           => $endAtUtc,
                    'current_time'     => $now,
                ]);

                return true;
            }
        }

        return false;
    }

    /**
     * Clean a meeting session by updating its status to ENDED.
     */
    private function cleanSession(MeetingSession $meetingSession): void
    {
        try {
            unset($meetingSession->companion_details);

            $meetingSession->update([
                'status' => MeetingSessionStatus::ENDED,
            ]);

            Log::info("Cleaned meeting session {$meetingSession->id}", [
                'session_id'      => $meetingSession->id,
                'previous_status' => $meetingSession->getOriginal('status'),
                'new_status'      => MeetingSessionStatus::ENDED->value,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to clean meeting session {$meetingSession->id}: ".$e->getMessage(), [
                'session_id' => $meetingSession->id,
                'exception'  => $e,
            ]);
            throw $e;
        }
    }
}
