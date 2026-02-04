<?php

namespace App\Jobs;

use App\Actions\MeetingSession\CreateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\MeetingSessionStatus;
use App\Models\Event;
use App\Models\MeetingSession;
use App\Models\ScheduledJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CreateNextMeetingSessionJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected MeetingSession $meetingSession;

    /**
     * Create a new job instance.
     */
    public function __construct(MeetingSession $meetingSession)
    {
        $this->meetingSession = $meetingSession;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user         = $this->meetingSession->user ?? \Auth::user();
        Log::info('Getting the next instance from events');
        $nextInstance = $this->getNextInstanceFromEvents($this->meetingSession);

        if ($nextInstance) {
            Log::info('Next instance found', [
                'next_instance' => $nextInstance,
            ]);
            // Use the Event's name if available; otherwise fall back to the existing meeting session name
            $meeting_name = $nextInstance->name ?? $this->meetingSession->name;

            // Convert string start_at/end_at to Carbon instances before manipulation
            $start_at = Carbon::parse($nextInstance->start_at)->setTimezone(
                'UTC',
            );
            $end_at = Carbon::parse($nextInstance->end_at)->setTimezone('UTC');

            $meetingId = (string) Str::ulid();

            // Use Event model's guests accessor to get an array of guests
            $eventGuests        = $nextInstance->guests;
            $external_attendees = [];

            foreach ($eventGuests as $guest) {
                // Assume that if 'name' is a valid email, then it represents the guest email
                if (
                    isset($guest['name']) && filter_var($guest['name'], FILTER_VALIDATE_EMAIL)
                ) {
                    $external_attendees[] = $guest['name'];
                }
            }

            // Fallback to the previous session's external attendees if none were found
            if (empty($external_attendees)) {
                $external_attendees = $this->meetingSession->external_attendees ?? [];
            }

            $data = new MeetingSessionData(
                meeting_id: $meetingId,
                // Using hangout_link if available; otherwise, it will be null
                meeting_url: $nextInstance->link ?? null,
                type: is_string($this->meetingSession->type)
                    ? $this->meetingSession->type
                    : $this->meetingSession->type->value,
                pulse_id: (string) $this->meetingSession->pulse_id,
                organization_id: (string) $this->meetingSession
                    ->organization_id,
                user_id: (string) $this->meetingSession->user_id,
                name: $meeting_name,
                description: $this->meetingSession->description,
                start_at: $start_at,
                end_at: $end_at,
                attendees: [],
                external_attendees: $external_attendees,
                invite_pulse: $this->meetingSession->recurring_invite,
                recurring_invite: $this->meetingSession->recurring_invite,
                gcal_meeting_id: $nextInstance->google_event_id,
                status: MeetingSessionStatus::INACTIVE->value,
                event_id: $nextInstance->id ? (string) $nextInstance->id : null,
                recurring_meeting_id: $this->meetingSession
                    ->recurring_meeting_id,
            );

            $newSession = (new CreateMeetingSessionAction())->handle(
                $data,
                true,
                $user,
            );

            Log::info('New session created, scheduling meeting summary reminder', [
                'new_session' => $newSession,
            ]);
            $this->scheduleMeetingSummaryReminder($this->meetingSession, $newSession);
            Log::info('Meeting summary reminder scheduled');
        } else {
            Log::info('No next instance found, skipping create next meeting session job');
        }
    }

    private function getNextInstanceFromEvents(MeetingSession $session)
    {
        $recurringEventId = $session->recurring_meeting_id;
        $pulseId          = $session->pulse_id;
        $userId           = $session->user_id;

        if (! $recurringEventId) {
            return null;
        }

        $googleEventIdPattern = $recurringEventId . '_%';

        $nextEvent = Event::where(
            'google_event_id',
            'like',
            $googleEventIdPattern,
        )
            ->where('pulse_id', $pulseId)
            ->where('user_id', $userId)
            ->where('start_at', '>', now())
            ->orderBy('start_at', 'asc')
            ->first();

        return $nextEvent;
    }

    private function scheduleMeetingSummaryReminder(MeetingSession $meetingSession, MeetingSession $nextMeetingSession)
    {
        try {
            $logParams = [
                'meeting_session_id' => $meetingSession->id,
                'recurring_meeting_id' => $meetingSession->recurring_meeting_id,
                'start_at' => $meetingSession->start_at,
                'end_at' => $meetingSession->end_at,
                'name' => $meetingSession->name,
                'url' => $meetingSession->meeting_url,
            ];
            // schedule if and only if the meeting session is recurring
            if (!$meetingSession->recurring_meeting_id) {
                Log::info('Skipping automated meeting summary reminder, meeting is recurring', $logParams);
                return;
            }
            
            $scheduleTime = Carbon::parse($nextMeetingSession->start_at)->subMinutes(10);
            // get the next meeting session date time
            Log::info('Scheduling automated meeting summary reminder, will be run at: ' . $scheduleTime->toDateTimeString(), $logParams);
            
            ScheduledJob::create([
                'on_queue' => true,
                'job_class' => ProcessRecurringMeetingJob::class,
                'payload' => ['meeting_session_id' => $meetingSession->id],
                'next_run_at' => $scheduleTime,
            ]);

        } catch (\Throwable $th) {
            Log::error('Error scheduling automated meeting summary reminder', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);
        }
    }
}
