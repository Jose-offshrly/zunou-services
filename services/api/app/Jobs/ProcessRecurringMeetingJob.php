<?php

namespace App\Jobs;

use App\Actions\Event\TrackRecurringMeetingUpdatesAction;
use App\Models\MeetingSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessRecurringMeetingJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected MeetingSession $meetingSession;
    protected TrackRecurringMeetingUpdatesAction $trackReccuringMeetingUpdatesAction;

    /**
     * Create a new job instance.
     */
    public function __construct(array $data)
    {
        if (!isset($data['meeting_session_id'])) {
            throw new \Exception('Meeting session ID is required');
        }
        
        $this->meetingSession = MeetingSession::find($data['meeting_session_id']);
        if (!$this->meetingSession) {
            throw new \Exception('Meeting session not found');
        }
        $this->trackReccuringMeetingUpdatesAction = new TrackRecurringMeetingUpdatesAction();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Processing recurring meeting: " . $this->meetingSession->name, [
            'meeting_session_id' => $this->meetingSession->id,
            'date' => $this->meetingSession->start_at,
        ]);
        if (!$this->meetingSession->dataSource) {
            Log::error("Meeting session does not have a data source or meeting", [
                'meeting_session_id' => $this->meetingSession->id,
                'data_source_id' => $this->meetingSession->dataSource?->id,
            ]);
            return;
        }

        $transcript = $this->meetingSession->dataSource->transcript;
        if (!$transcript) {
            Log::error("Meeting session does not have a transcript", [
                'meeting_session_id' => $this->meetingSession->id,
                'meeting_id' => $this->meetingSession->meeting?->id,
            ]);
            return;
        }

        $this->trackReccuringMeetingUpdatesAction->handle($this->meetingSession);
    }
}
