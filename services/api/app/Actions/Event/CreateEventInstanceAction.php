<?php

namespace App\Actions\Event;

use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Models\EventInstance;

class CreateEventInstanceAction
{
    public function handle(EventInstanceData $data): EventInstance
    {
        // Create the EventInstance using DTO properties
        $eventInstance = EventInstance::create([
            'event_id'          => $data->event_id,
            'pulse_id'          => $data->pulse_id,
            'local_description' => $data->local_description,
            'priority'          => $data->priority,
        ]);

        return $eventInstance->refresh();
    }
}
