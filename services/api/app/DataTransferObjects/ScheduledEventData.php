<?php

namespace App\DataTransferObjects;

use App\Enums\EventSourceType;
use App\Support\Data;
use Illuminate\Support\Carbon;

class ScheduledEventData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $date,
        public readonly Carbon $start_at,
        public readonly Carbon $end_at,
        public readonly string $pulse_id,
        public readonly string $organization_id,
        public readonly string $user_id,
        public readonly bool $create_event,
        public readonly ?string $link = null,
        public readonly ?string $location = null,
        public readonly ?string $priority = null,
        public readonly ?string $summary = null,
        public readonly ?string $description = null,
        public readonly ?array $attendees = [],
        public readonly ?array $files = [],
        public readonly ?string $google_event_id = null,
        public readonly bool $invite_pulse = false,
        public readonly ?EventSourceType $source_type = null,
        public readonly ?string $source_id = null,
        public readonly ?array $source_data = null,
        public readonly bool $sync_with_source = false,
        public readonly ?string $time_zone = null,
    ) {
    }

    public static function from(array $data): static
    {
        return new ScheduledEventData(
            name: $data['name'],
            date: $data['date'],
            start_at: $data['start_at'] instanceof Carbon
                ? $data['start_at']
                : Carbon::parse($data['start_at']),
            end_at: $data['end_at'] instanceof Carbon
                ? $data['end_at']
                : Carbon::parse($data['end_at']),
            pulse_id: $data['pulse_id'],
            organization_id: $data['organization_id'],
            user_id: $data['user_id'],
            create_event: $data['create_event'],
            link: $data['link']         ?? null,
            location: $data['location'] ?? null,
            priority: $data['priority'] ?? null,
            summary: $data['summary']   ?? null,
            description: self::normalizeDescription(
                $data['description'] ?? null,
            ),
            attendees: $data['attendees']                 ?? [],
            files: $data['files']                         ?? [],
            google_event_id: $data['google_event_id']     ?? null,
            invite_pulse: $data['invite_pulse']           ?? false,
            source_type: EventSourceType::GOOGLE_CALENDAR ?? null,
            source_id: $data['source_id']                 ?? null,
            source_data: [
                'original_calendar_data' => $data,
                'recurring_meeting_id'   => $data['recurring_meeting_id'] ?? null,
                'conference_data'        => $data['conferenceData']       ?? null,
                'imported_at'            => now()->toISOString(),
                'sync_job'               => 'FetchUserGoogleCalendarEventsJob',
            ],
            sync_with_source: false, // Don't sync back since we're importing from source
            time_zone: $user->timezone ?? 'UTC',
        );
    }

    private static function normalizeDescription(?string $description): ?string
    {
        if ($description === null || $description === '') {
            return null;
        }

        return trim($description);
    }
}
