<?php

namespace App\Actions\Event;

use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Models\EventInstance;

class CreateEventInstanceAction
{
    public function handle(EventInstanceData $data): EventInstance
    {
        // Ensure only one EventInstance per (event_id, pulse_id)
        $eventInstance = EventInstance::firstOrCreate(
            [
                'event_id' => $data->event_id,
                'pulse_id' => $data->pulse_id,
            ],
            [
                'local_description' => $data->local_description,
                'priority'          => $data->priority,
                'is_recurring'      => $data->is_recurring,
            ]
        );

        return $eventInstance->refresh();
    }
}
