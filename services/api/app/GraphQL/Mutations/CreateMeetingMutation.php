<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\DataTransferObjects\FileData;
use App\DataTransferObjects\MeetingData;
use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Facades\MeetingFacade;
use App\Models\DataSource;
use App\Models\Event;
use App\Models\Meeting;
use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

final readonly class CreateMeetingMutation
{
    public function __invoke(null $_, array $args): Meeting
    {
        $user = auth()->user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $pulse = Pulse::find($args['pulseId']);
        Log::info('CreateMeetingMutation >>>> Pulse:', $pulse->toArray());
        if (! $pulse) {
            throw new Error('Pulse not found');
        }

        // Validate event access if eventId is provided
        $event = null;
        if (isset($args['eventId'])) {
            $event = Event::find($args['eventId']);
            if (! $event) {
                throw new Error('Event not found');
            }
            if ($event->organization_id !== $pulse->organization_id) {
                throw new Error('Event belongs to a different organization');
            }
            Log::info('CreateMeetingMutation >>>> Linking to Event:', ['event_id' => $event->id]);
        }

        $file = null;

        if (isset($args['metadata'])) {
            $file = new FileData(
                file_key: $args['metadata']['fileKey'],
                file_name: $args['metadata']['fileName'],
            );
        }

        $dataSource = $this->createDataSource(
            pulse: $pulse,
            user: $user,
            args: $args,
            isOnDevice: isset($args['eventId']),
        );

        $data = new MeetingData(
            title: $args['title'],
            pulse_id: $pulse->id,
            user_id: $user->id,
            date: $event?->date ? Carbon::parse($event->date) : now(),
            organizer: $user->email,
            transcript: $args['transcript']     ?? null,
            participants: $args['participants'] ?? null,
            fileData: $file,
            dataSource: $dataSource,
            pulse: $pulse,
        );

        $meeting = MeetingFacade::driver('manual')->create($data);

        // Link meeting to event if eventId was provided
        if ($event) {
            $this->linkMeetingToEvent(
                meeting: $meeting,
                event: $event,
                dataSource: $dataSource,
                pulse: $pulse,
                user: $user,
                eventInstanceId: $args['eventInstanceId'] ?? null,
            );
        }

        return $meeting->fresh(['meetingSession', 'meetingSession.dataSource']);
    }

    private function linkMeetingToEvent(
        Meeting $meeting,
        Event $event,
        DataSource $dataSource,
        Pulse $pulse,
        User $user,
        ?string $eventInstanceId = null,
    ): void {
        Log::info('CreateMeetingMutation >>>> Linking meeting to event', [
            'meeting_id' => $meeting->id,
            'event_id'   => $event->id,
        ]);

        // Find existing MeetingSession or create new one
        $meetingSession = MeetingSession::where('event_id', $event->id)->first();

        if ($meetingSession) {
            Log::info('CreateMeetingMutation >>>> Using existing MeetingSession', [
                'meeting_session_id' => $meetingSession->id,
            ]);
            // Update existing session
            $meetingSession->update([
                'status'              => MeetingSessionStatus::ENDED,
                'data_source_id'      => $dataSource->id,
                'internal_meeting_id' => $meeting->id,
            ]);
        } else {
            Log::info('CreateMeetingMutation >>>> Creating new MeetingSession');
            // Create new meeting session
            $meetingSession = MeetingSession::create([
                'meeting_id'          => strtolower((string) Str::ulid()),
                'meeting_url'         => $event->link ?? 'on-device-recording',
                'event_id'            => $event->id,
                'event_instance_id'   => $eventInstanceId,
                'pulse_id'            => $pulse->id,
                'organization_id'     => $pulse->organization_id,
                'user_id'             => $user->id,
                'type'                => MeetingSessionType::MEETING,
                'status'              => MeetingSessionStatus::ENDED,
                'name'                => $meeting->title,
                'start_at'            => $event->getRawOriginal('start_at') ?? now(),
                'end_at'              => $event->getRawOriginal('end_at') ?? now(),
                'invite_pulse'        => false,
                'data_source_id'      => $dataSource->id,
                'internal_meeting_id' => $meeting->id,
            ]);
        }

        // Link meeting to event
        $meeting->update(['event_id' => $event->id]);

        Log::info('CreateMeetingMutation >>>> Successfully linked meeting to event', [
            'meeting_id'         => $meeting->id,
            'meeting_session_id' => $meetingSession->id,
            'data_source_id'     => $dataSource->id,
        ]);
    }

    public function createDataSource(
        Pulse $pulse,
        User $user,
        array $args,
        bool $isOnDevice = false,
    ): DataSource {
        Log::info(
            '[CreateMeetingMutation: createDataSource]: Meeting instance',
        );
        $meeting = Meeting::make([
            'title'      => $args['title'],
            'user_id'    => $user->id,
            'pulse_id'   => $pulse->id,
            'meeting_id' => 'manual',
            'date'       => now(),
            'organizer'  => $user->email,
            'source'     => $isOnDevice ? 'on_device' : 'manual',
            'status'     => 'added',
        ]);

        return (new CreateMeetingDataSourceAction())->handle(
            meeting: $meeting,
            organizationId: $pulse->organization_id,
            pulseId: $pulse->id,
            origin: $isOnDevice ? 'on_device' : null,
        );
    }
}
