<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\MeetingSession\CreateMeetingSessionAction;
use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\Enums\MeetingSessionType;
use App\Enums\MeetingType;
use App\Models\MeetingSession;
use App\Models\Organization;
use App\Models\Pulse;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CreateMeetingSessionMutation
{
    public function __construct(
        protected CreateMeetingSessionAction $createMeetingSessionAction,
    ) {
    }

    public function __invoke($_, array $args): MeetingSession
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('no user found!');
            }

            if (! isset($args['meeting_url']) && $args['type'] === MeetingSessionType::MEETING->value) {
                throw new Error('Meeting link is required to invite bot to a meeting!');
            }

            // Find if there is an active meeting with the same meeting url
            if (isset($args['meeting_url']) && $args['meeting_url']) {
                $canonicalMeetingUrl = $this->sanitizeMeetingUrl(
                    $args['meeting_url'],
                );
                $duplicateStates     = ['waiting_to_join', 'in_meeting', 'paused'];
                $args['meeting_url'] = $canonicalMeetingUrl;
                $existingMeeting     = MeetingSession::where(
                    'meeting_url',
                    $args['meeting_url'],
                )
                    ->where('pulse_id', $args['pulseId'])
                    ->whereIn('companion_status', $duplicateStates)
                    ->first();
                if ($existingMeeting) {
                    throw new Error('The same meeting is already ongoing.');
                }
            }

            if (isset($args['gcal_meeting_id']) && $args['gcal_meeting_id']) {
                $existingMeeting = MeetingSession::where(
                    'gcal_meeting_id',
                    $args['gcal_meeting_id'],
                )
                    ->where('pulse_id', $args['pulseId'])
                    ->first();
                if ($existingMeeting) {
                    throw new Error(
                        'The same Google Calendar meeting already exists.',
                    );
                }
            }

            $meeting_id = (string) Str::ulid();

            $pulse           = Pulse::findOrFail($args['pulseId']);
            $organization_id = Organization::findOrFail($args['organizationId'])
                ->id;

            $attendees = isset($args['attendees']) ? $args['attendees'] : null;

            // Format the date and time
            $start_at = isset($args['start_at'])
                ? Carbon::parse(
                    $args['start_at'],
                    Auth::user()->timezone,
                )->setTimezone('UTC')
                : Carbon::now();
            $formatted_date = $start_at
                ->timezone(Auth::user()->timezone)
                ->format('M d, Y h:i A');

            // Create the meeting name with pulse name and date/time
            $meeting_name = isset($args['name'])
                ? $args['name']
                : sprintf('%s Meeting %s', $pulse->name, $formatted_date);

            $data = new MeetingSessionData(
                meeting_id: (string) $meeting_id,
                meeting_url: $args['meeting_url'] ?? null,
                type: $args['type'],
                pulse_id: $pulse->id,
                organization_id: $organization_id,
                user_id: $user->id,
                name: $meeting_name,
                description: $args['description'] ?? null,
                start_at: $start_at,
                end_at: isset($args['end_at'])
                    ? Carbon::parse(
                        $args['end_at'],
                        Auth::user()->timezone,
                    )->setTimezone('UTC')
                    : Carbon::now()->addHour(),
                attendees: $attendees,
                external_attendees: $args['external_attendees']     ?? null,
                invite_pulse: $args['invite_pulse']                 ?? false,
                gcal_meeting_id: $args['gcal_meeting_id']           ?? null,
                status: $args['status']                             ?? null,
                recurring_meeting_id: $args['recurring_meeting_id'] ?? null,
                recurring_invite: $args['recurring_invite']         ?? null,
                event_id: $args['event_id']                         ?? null,
                event_instance_id: $args['event_instance_id']       ?? null,
                passcode: $args['passcode']                         ?? null,
                meeting_type: isset($args['meeting_type']) ? MeetingType::fromName($args['meeting_type']) : null,
            );

            return $this->createMeetingSessionAction->handle(data: $data);
        } catch (\Exception $e) {
            throw new Error(
                'Failed to create a meeting session: '.$e->getMessage(),
            );
        }
    }

    private function sanitizeMeetingUrl(string $url): string
    {
        $parts = parse_url($url);
        if (! isset($parts['scheme'], $parts['host'], $parts['path'])) {
            // If the URL is not well formed, just return it as is.
            return $url;
        }

        if (strcasecmp($parts['host'], 'meet.google.com') !== 0) {
            return $url;
        }

        $path = $parts['path'] ?? '';

        return $parts['scheme'].'://'.$parts['host'].$path;
    }
}
