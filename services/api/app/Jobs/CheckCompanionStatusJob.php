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

    /**
     * Create a new job instance.
     */
    public function __construct(
        MeetingSession $meetingSession,
        int $pollInterval = 5,
    ) {
        $this->meetingSession = $meetingSession;
        $this->pollInterval   = $pollInterval;
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

        // Stop if 404 - resource not found
        if ($response->status() === 404) {
            Log::info(
                "Meeting {$this->meetingSession->name} status endpoint returned 404, stopping polling",
            );

            $this->meetingSession->companion_status = 'not_found';
            $this->meetingSession->save();

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
