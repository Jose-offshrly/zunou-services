<?php

namespace App\Services\Calendar;

use App\DataTransferObjects\ScheduledEventData;
use App\Models\Event;
use App\Models\EventSource;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class SourcedEventService
{
    public function updateOrCreate(ScheduledEventData $data, User $user): EventSource
    {
        $sourceData = [
            'source'    => $data->source_type,
            'source_id' => $data->google_event_id ?? $this->generateSourceId($data),
            'user_id'   => (string)$user->id,
            'date'      => $data->date,
            'data'      => array_merge($data->source_data ?? [], [
                'name'         => $data->name,
                'location'     => $data->location,
                'attendees'    => $data->attendees,
                'description'  => $data->description,
                'summary'      => $data->summary,
                'timezone'     => $data->time_zone,
                'sync_enabled' => $data->sync_with_source,
            ]),
        ];

        return EventSource::updateOrCreate(
            [
                'source_id' => $data->google_event_id,
                'user_id'   => $user->id,
                'source'    => $data->source_type,
            ],
            $sourceData,
        );
    }

    public function linkEventToSource(Event $event, EventSource $eventSource): void
    {
        // Update the event with the event source relationship
        $event->update(['event_source_id' => $eventSource->id]);

        Log::info('Event linked to source', [
            'event_id'        => $event->id,
            'event_source_id' => $eventSource->id,
            'source_type'     => $eventSource->source,
        ]);
    }

    /**
     * Generate a unique source ID for the event
     */
    public function generateSourceId(ScheduledEventData $data): string
    {
        if ($data->google_event_id) {
            return $data->google_event_id;
        }

        // Generate a unique identifier based on event details
        return hash('sha256', sprintf(
            '%s-%s-%s-%s-%s',
            $data->name,
            $data->start_at,
            $data->end_at,
            $data->user_id,
            $data->source_type->value,
        ));
    }
}
