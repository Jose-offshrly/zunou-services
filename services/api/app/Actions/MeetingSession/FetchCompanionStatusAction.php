<?php

namespace App\Actions\MeetingSession;

use App\Enums\MeetingSessionStatus;
use App\Models\MeetingSession;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchCompanionStatusAction
{
    /**
     * @throws ConnectionException
     */
    public function handle(): Collection
    {
        $response = $this->fetchRecordings();

        if (! $response) {
            return collect();
        }

        return $this->matchMeetingSessions($response);
    }

    /**
     * Check if the companion service is healthy
     */
    public function isHealthy(): bool
    {
        try {
            $url      = config('zunou.companion.recordings_url');
            $response = Http::timeout(10)->get($url);

            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Companion service health check failed', [
                'url'   => config('zunou.companion.recordings_url'),
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @throws ConnectionException
     */
    public function fetchRecordings(array $query = []): ?array
    {
        $url        = config('zunou.companion.recordings_url');
        $maxRetries = 3;
        $retryDelay = 2; // seconds

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                Log::info("Attempting to fetch recordings (attempt {$attempt}/{$maxRetries})", [
                    'url'   => $url,
                    'query' => $query,
                ]);

                $response = Http::acceptJson()
                    ->withHeaders([
                        'Accept' => 'application/json',
                    ])
                    ->timeout(30)
                    ->get($url, $query);

                if ($response->successful()) {
                    Log::info("Successfully fetched recordings on attempt {$attempt}");

                    return $response->json();
                }

                // Log the failed attempt
                $errorDetails = [
                    'attempt'      => $attempt,
                    'url'          => $url,
                    'status'       => $response->status(),
                    'headers'      => $response->headers(),
                    'body'         => $response->body(),
                    'query_params' => $query,
                ];

                Log::warning("Scheduler recordings request failed (attempt {$attempt}/{$maxRetries})", $errorDetails);

                // If this is the last attempt, report the error
                if ($attempt === $maxRetries) {
                    report('Scheduler recordings request failed after all retries', $errorDetails);

                    return null;
                }

                // Wait before retrying
                sleep($retryDelay);

            } catch (\Exception $e) {
                Log::error("Scheduler recordings request exception (attempt {$attempt}/{$maxRetries})", [
                    'url'          => $url,
                    'query_params' => $query,
                    'exception'    => $e->getMessage(),
                    'attempt'      => $attempt,
                ]);

                if ($attempt === $maxRetries) {
                    report('Scheduler recordings request exception after all retries: '.$e->getMessage(), [
                        'url'          => $url,
                        'query_params' => $query,
                        'exception'    => $e,
                    ]);

                    return null;
                }

                // Wait before retrying
                sleep($retryDelay);
            }
        }

        return null;
    }

    public function matchMeetingSessions(array $response): Collection
    {
        // Convert response to collection
        $recordings = collect($response['recordings'] ?? []);

        // Build O(1) lookup by meeting_id for companion details
        $recordingsByMeetingId = $recordings
            ->filter(fn ($r) => ! empty($r['meeting_id']))
            ->keyBy('meeting_id');

        // Extract unique meeting_ids (may be empty)
        $meetingIds = $recordingsByMeetingId->keys();

        // Single query: fetch sessions that either
        // 1) match any recording meeting_id, OR
        // 2) are upcoming and invite_pulse=true (regardless of recording list)
        $query = MeetingSession::query()->with(['pulse']);

        if ($meetingIds->isNotEmpty()) {
            $query->where(function ($q) use ($meetingIds) {
                $q->whereIn('meeting_id', $meetingIds->values()->all())
                  ->orWhere(function ($q2) {
                      $q2->where('status', MeetingSessionStatus::INACTIVE->value)
                         ->where('start_at', '>', now())
                         ->where('invite_pulse', true);
                  });
            });
        } else {
            // No recordings; only fetch upcoming sessions
            $query->where('status', MeetingSessionStatus::INACTIVE->value)
                  ->where('start_at', '>', now())
                  ->where('invite_pulse', true);
        }

        $sessions = $query->get();

        // In-memory de-duplication in case a session satisfies both branches
        $uniqueSessions = $sessions->unique('id')->values();

        return $uniqueSessions->map(function (MeetingSession $session) use ($recordingsByMeetingId) {
            $session->companion_details = $recordingsByMeetingId->get($session->meeting_id);
            return $session;
        });
    }

    /**
     * Build the recordings lookup map from API response.
     */
    public function buildRecordingsMap(?array $response): Collection
    {
        if (! $response) {
            return collect();
        }

        $recordings = collect($response['recordings'] ?? []);

        return $recordings
            ->filter(fn ($r) => ! empty($r['meeting_id']))
            ->keyBy('meeting_id');
    }

    /**
     * Build the query for fetching meeting sessions (without executing it).
     * Useful for chunked processing.
     */
    public function buildSessionsQuery(Collection $recordingsByMeetingId): \Illuminate\Database\Eloquent\Builder
    {
        $meetingIds = $recordingsByMeetingId->keys();

        $query = MeetingSession::query()->with(['pulse']);

        if ($meetingIds->isNotEmpty()) {
            $query->where(function ($q) use ($meetingIds) {
                $q->whereIn('meeting_id', $meetingIds->values()->all())
                  ->orWhere(function ($q2) {
                      $q2->where('status', MeetingSessionStatus::INACTIVE->value)
                         ->where('start_at', '>', now())
                         ->where('invite_pulse', true);
                  });
            });
        } else {
            // No recordings; only fetch upcoming sessions
            $query->where('status', MeetingSessionStatus::INACTIVE->value)
                  ->where('start_at', '>', now())
                  ->where('invite_pulse', true);
        }

        return $query;
    }
}
