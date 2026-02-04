<?php

namespace App\GraphQL\Mutations;

use App\Jobs\ProcessRecurringMeetingJob;
use App\Models\MeetingSession;
use App\Models\ScheduledJob;
use Carbon\Carbon;
use DateTimeZone;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

class ManuallyScheduleRecurringMeetingSummaryMutation
{
    /**
     * Handle the GraphQL manuallyScheduleRecurringMeetingSummary mutation.
     *
     * @param  null  $_
     */
    public function __invoke($_, array $args): String
    {
        $nextMeetingSession = MeetingSession::find($args['next_meeting_session_id']);
        $meetingSession = MeetingSession::find($args['meeting_session_id']);
        if (!$nextMeetingSession || !$meetingSession) {
            throw new Error('Next meeting session or meeting session not found');
        }

        $logParams = [
            'meeting_session_id' => $meetingSession->id,
        ];
        $delayMinutes = $args['delay_minutes'] ?? 10;
        $scheduleTime = Carbon::parse($nextMeetingSession->getRawOriginal('start_at'))->subMinutes($delayMinutes);

        // get the next meeting session date time
        Log::info('Scheduling automated meeting summary reminder, will be run at: ' . $scheduleTime->toDateTimeString(), $logParams);
        
        $scheduledJob = ScheduledJob::create([
            'on_queue' => true,
            'job_class' => ProcessRecurringMeetingJob::class,
            'payload' => ['meeting_session_id' => $meetingSession->id],
            'next_run_at' => $scheduleTime,
        ]);

        return 'Successfully scheduled recurring meeting summary for meeting session: ' . $meetingSession->id . ' at ' . $scheduleTime->toDateTimeString() . ' with scheduled job id: ' . $scheduledJob->id;
    }
}
