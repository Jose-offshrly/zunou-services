<?php

namespace App\Actions\Event;

use App\Contracts\Eventable;
use App\Models\Event;
use App\Models\EventOwner;

class CreateEventOwnerAction
{
    public function handle(Event $event, Eventable $eventable): EventOwner
    {
        return $eventable->eventsOwned()->create(['event_id' => $event->id]);
    }
}
