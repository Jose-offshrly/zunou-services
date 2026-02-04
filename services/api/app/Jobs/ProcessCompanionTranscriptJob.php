<?php

namespace App\Jobs;

use App\Concerns\SimpleQueueServiceHandler;
use App\DataTransferObjects\MeetingData;
use App\Facades\MeetingFacade;
use App\Models\DataSource;
use App\Models\MeetingSession;
use App\Models\Pulse;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessCompanionTranscriptJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;
    use SimpleQueueServiceHandler;

    /**
     * Create a new job instance.
     */
    public function __construct(
        private readonly MeetingSession $meetingSession,
        private readonly DataSource $dataSource,
        private readonly Pulse $pulse,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $transcript = $this->fetchTranscriptFromSqs(
            meetingSession: $this->meetingSession,
        );

        Log::info('Pulse Companion Transcript', ['transcript' => $transcript]);

        $data = new MeetingData(
            title: $this->meetingSession->name ?? $this->meetingSession->meeting_id,
            pulse_id: $this->meetingSession->pulse_id,
            user_id: $this->meetingSession->user_id,
            date: now(),
            organizer: $this->meetingSession->user->email,
            transcript: $transcript,
            source: 'companion',
            dataSource: $this->dataSource,
            pulse: $this->pulse,
        );

        $meeting = MeetingFacade::driver('companion')->create($data);

        $this->meetingSession->internal_meeting_id = $meeting->id;
        $this->meetingSession->save();
    }
}
