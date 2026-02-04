<?php

namespace App\Actions\Event;

use App\DataTransferObjects\ScheduledEventData;
use App\Models\Event;
use App\Models\User;
use App\Services\Calendar\SourcedEventService;
use DB;
use Illuminate\Support\Facades\Log;

readonly class CreateSourcedEventAction
{
    public function __construct(
        private CreateEventAction $createEventAction,
        private SourcedEventService $eventSourceService,
    ) {
    }

    /**
     * Create an event with event source integration
     */
    public function handle(ScheduledEventData $data): Event
    {
        try {
            return DB::transaction(function () use ($data) {
                $user        = User::findOrFail($data->user_id);
                $eventSource = null;

                if ($data->source_type) {
                    $eventSource = $this->eventSourceService->updateOrCreate($data, $user);
                }

                $event = $this->createEventAction->handle($data);

                if ($eventSource) {
                    $this->eventSourceService->linkEventToSource($event, $eventSource);

                    Log::info('Successfully created event with source', [
                        'event_id'        => $event->id,
                        'event_source_id' => $eventSource->id,
                        'source_type'     => $data->source_type->value,
                        'sync_enabled'    => $data->sync_with_source,
                    ]);
                } else {
                    Log::info('Successfully created event without source', [
                        'event_id' => $event->id,
                    ]);
                }

                return $event->fresh([
                    'user',
                    'pulse',
                    'organization',
                    'meetingSession',
                ]);
            });
        } catch (\Throwable $e) {

        }
    }
}
