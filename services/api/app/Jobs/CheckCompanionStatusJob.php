<?php

namespace App\Jobs;

use App\Concerns\CompanionHandler;
use App\Events\CompanionStatusEvent;
use App\Models\MeetingSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckCompanionStatusJob implements ShouldQueue
{
    use CompanionHandler;
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public MeetingSession $meetingSession;

    public $pollInterval; // seconds between polls

    public $notFoundRetries; // number of consecutive 404 responses

    private const MAX_NOT_FOUND_RETRIES = 10;

    /**
     * Create a new job instance.
     */
    public function __construct(
        MeetingSession $meetingSession,
        int $pollInterval = 5,
        int $notFoundRetries = 0,
    ) {
        $this->meetingSession  = $meetingSession;
        $this->pollInterval    = $pollInterval;
        $this->notFoundRetries = $notFoundRetries;

        // Dispatch only after the current DB transaction has committed.
        // Without this, the MeetingSession may not yet be visible to the
        // queue worker and the job would fail with ModelNotFoundException.
        $this->afterCommit = true;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1️⃣ Fetch the status from the API
        $response = Http::get(config('zunou.companion.status_url'), [
            'meeting_id' => $this->meetingSession->meeting_id,
        ]);

        // Handle 404 - the bot may not have registered in DynamoDB yet.
        // Retry up to MAX_NOT_FOUND_RETRIES before giving up.
        if ($response->status() === 404) {
            if ($this->notFoundRetries >= self::MAX_NOT_FOUND_RETRIES) {
                Log::info(
                    "Meeting {$this->meetingSession->name} status endpoint returned 404 after "
                    . self::MAX_NOT_FOUND_RETRIES . " retries, stopping polling",
                );

                $this->processBotStatus('not_found', [
                    'status'  => 'not_found',
                    'message' => 'Bot not found after maximum retries',
                ]);

                return;
            }

            Log::info(
                "Meeting {$this->meetingSession->name} status endpoint returned 404, "
                . "retrying ({$this->notFoundRetries}/" . self::MAX_NOT_FOUND_RETRIES . ")",
            );

            self::dispatch(
                $this->meetingSession,
                $this->pollInterval,
                $this->notFoundRetries + 1,
            )->delay(now()->addSeconds($this->pollInterval));

            return;
        }

        // handle HTTP errors
        if ($response->status() !== 200) {
            Log::info('ERROR:'.$response->body());

            // Check if the error response contains recorder_unavailable status
            $data   = $response->json();
            $status = $data['status'] ?? null;

            // If status is recorder_unavailable or finished, stop recursion
            if (in_array($status, ['finished', 'recorder_unavailable'])) {
                Log::info(
                    "Meeting {$this->meetingSession->name} recorder unavailable, stopping polling",
                );
                $this->processBotStatus($status, $data);

                return;
            }

            // Retry after interval if API fails (but not for recorder_unavailable)
            self::dispatch($this->meetingSession, $this->pollInterval)->delay(
                now()->addSeconds($this->pollInterval),
            );

            return;
        }

        $data   = $response->json();
        $status = $data['status'] ?? null;

        // 2️⃣ Process the response here
        $this->processBotStatus($status, $data);

        // 3️⃣ If status is NOT recorder_unavailable,finished, schedule another poll
        if (! in_array($status, ['finished', 'recorder_unavailable', ''])) {
            self::dispatch($this->meetingSession, $this->pollInterval)->delay(
                now()->addSeconds($this->pollInterval),
            );
        }
    }

    /**
     * Process the API response.
     */
    protected function processBotStatus(?string $status, array $data): void
    {
        Log::info(
            "Meeting {$this->meetingSession->name} status: {$status}",
            $data,
        );

        // Check if status has actually changed to avoid unnecessary notifications
        $statusChanged = $this->meetingSession->companion_status !== $status;

        // Only notify if status has changed
        if ($statusChanged) {
            $this->meetingSession->companion_status = $status;
            $this->meetingSession->save();

            $this->notify(data: $data);

            // End the meeting session when companion status becomes finished
            if ($status === 'finished') {
                $this->endMeetingSession($this->meetingSession);
            }
        }
    }

    private function notify(array $data): void
    {
        event(
            new CompanionStatusEvent(
                meetingSession: $this->meetingSession,
                data: $data,
            ),
        );
    }
}
