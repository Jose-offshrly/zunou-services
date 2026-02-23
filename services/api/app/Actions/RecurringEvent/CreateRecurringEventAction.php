<?php

declare(strict_types=1);

namespace App\Actions\RecurringEvent;

use App\DataTransferObjects\RecurringEventData;
use App\Models\RecurringEvent;
use Illuminate\Support\Facades\Log;

class CreateRecurringEventAction
{
    public function handle(RecurringEventData $data): RecurringEvent
    {
        $recurringEvent = RecurringEvent::create([
            'google_parent_id' => $data->google_parent_id,
        ]);

        Log::info('Created recurring event', [
            'recurring_event_id' => $recurringEvent->id,
            'google_parent_id'   => $data->google_parent_id,
        ]);

        return $recurringEvent;
    }
}
