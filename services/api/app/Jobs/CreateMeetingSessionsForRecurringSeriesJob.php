<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\MeetingSession\CreateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\MeetingSessionType;
use App\Enums\MeetingType;
use App\Events\RecurringMeetingSessionsCreated;
use App\Models\Event;
use App\Models\EventInstance;
use App\Models\MeetingSession;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CreateMeetingSessionsForRecurringSeriesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected string $eventInstanceId,
        protected string $pulseId,
        protected MeetingSession $meetingSession,
        protected string $userId,
    ) {
    }

    public function handle(CreateMeetingSessionAction $createMeetingSessionAction): void
    {
        try {
            $user = User::findOrFail($this->userId);

            $eventInstance = EventInstance::with('event.recurringEvent')->findOrFail($this->eventInstanceId);
            $event = $eventInstance->event;

            if (!$event || !$event->recurring_event_id || !$event->recurringEvent) {
                return;
            }

            // Check invite_notetaker via recurring_event_instance_setup scoped by pulse_id
            $setup = $event->recurringEvent
                ->instanceSetups()
                ->where('pulse_id', $this->pulseId)
                ->first();

            if (!$setup || !$setup->invite_notetaker) {
                return;
            }

            // Create meeting sessions for all other event instances in the recurring series
            // for this pulse that don't already have a meeting session
            $seriesInstances = EventInstance::with('event')
                ->where('pulse_id', $this->pulseId)
                ->whereHas('event', function ($query) use ($event) {
                    $query->where('recurring_event_id', $event->recurring_event_id);
                })
                ->where('id', '!=', $this->eventInstanceId)
                ->whereDoesntHave('meetingSession')
                ->get();

            foreach ($seriesInstances as $instance) {
                $instanceEvent = $instance->event;
                if (!$instanceEvent) {
                    continue;
                }

                $instanceData = new MeetingSessionData(
                    meeting_id: strtolower((string) Str::ulid()),
                    meeting_url: $instanceEvent->link ?? null,
                    type: MeetingSessionType::MEETING->value,
                    pulse_id: $instance->pulse_id,
                    organization_id: $instanceEvent->organization_id,
                    user_id: $instanceEvent->user_id ?? $this->userId,
                    name: $instanceEvent->name,
                    description: $instanceEvent->summary ?? null,
                    start_at: $instanceEvent->getRawOriginal('start_at')
                        ? Carbon::parse($instanceEvent->getRawOriginal('start_at'))
                        : null,
                    end_at: $instanceEvent->getRawOriginal('end_at')
                        ? Carbon::parse($instanceEvent->getRawOriginal('end_at'))
                        : null,
                    attendees: null,
                    external_attendees: null,
                    invite_pulse: true,
                    gcal_meeting_id: $instanceEvent->google_event_id ?? null,
                    status: $this->meetingSession->status?->value,
                    recurring_meeting_id: $event->recurringEvent->google_parent_id ?? null,
                    recurring_invite: true,
                    event_instance_id: $instance->id,
                    passcode: null,
                    meeting_type: $this->meetingSession->meeting_type,
                );

                $createMeetingSessionAction->handle(data: $instanceData, fromRecurring: true, user: $user);
            }


            event(new RecurringMeetingSessionsCreated(
                pulseId: $this->pulseId,
                organizationId: $this->meetingSession->organization_id,
            ));
        } catch (\Exception $e) {
            Log::error('Failed to create meeting sessions for recurring series', [
                'event_instance_id' => $this->eventInstanceId,
                'pulse_id' => $this->pulseId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
