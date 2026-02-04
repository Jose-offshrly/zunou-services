<?php

namespace App\Jobs;

use App\Concerns\CompanionHandler;
use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Enums\MeetingSessionStatus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Queue\Queueable;

class CreateMeetingDataSourceJob implements ShouldQueue
{
    use Queueable;
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;
    use CompanionHandler;

    protected MeetingSession $meetingSession;
    /**
     * Create a new job instance.
     */
    public function __construct(MeetingSession $meetingSession)
    {
        //
        $this->meetingSession = $meetingSession;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $pulse = Pulse::find($this->meetingSession->pulse_id);
        if (!$pulse) {
            return;
        }
        $recording = $this->getValidCompanionRecording($this->meetingSession);
        if ($recording) {
            \Log::info(
                '[CreateMeetingDataSourceJob] Valid recording found, creating data source.'
            );
            $dataSource = $this->createDataSource(
                $pulse,
                $this->meetingSession
            );
            $this->meetingSession->update([
                'data_source_id' => $dataSource->id,
            ]);
            $this->meetingSession->refresh();
        } else {
            \Log::warning(
                '[CreateMeetingDataSourceJob] No valid recording found, updating status to STOPPED without data source.'
            );
        }
    }
}
