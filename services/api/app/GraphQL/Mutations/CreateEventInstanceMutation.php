<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Event\CreateEventInstanceAction;
use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Models\Event;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

final readonly class CreateEventInstanceMutation
{
    public function __construct(
        private CreateEventInstanceAction $createEventInstanceAction,
    ) {
    }

    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $this->validateInput($args);

            $addAllInstance = $args['add_all_instance'] ?? false;

            if ($addAllInstance) {
                return $this->createInstancesForAllRecurringEvents($args);
            }

            $data = EventInstanceData::from($args);

            return $this->createEventInstanceAction->handle($data);
        } catch (\Exception $e) {
            throw new Error('Failed to create event instance: ' . $e->getMessage());
        }
    }

    /**
     * Create event instances for all events in the same recurring series.
     *
     * Looks up the google_event_id of the given event, extracts the base
     * recurring ID (prefix before the "_" timestamp suffix), then creates
     * an EventInstance for every event whose google_event_id shares that
     * prefix — all linked to the provided pulse_id.
     */
    private function createInstancesForAllRecurringEvents(array $args): \App\Models\EventInstance
    {
        $event = Event::findOrFail($args['event_id']);

        if (! $event->google_event_id) {
            // No google_event_id — fall back to creating a single instance
            $data = EventInstanceData::from($args);

            return $this->createEventInstanceAction->handle($data);
        }

        $baseEventId = $this->extractBaseEventId($event->google_event_id);

        // Find all events in the same recurring series within the same organization
        // Only include events from today onwards
        $recurringEvents = Event::where('organization_id', $event->organization_id)
            ->where('google_event_id', 'like', $baseEventId . '%')
            ->where('start_at', '>=', now()->startOfDay())
            ->get();

        Log::info('Creating event instances for all recurring events', [
            'base_event_id'         => $baseEventId,
            'organization_id'       => $event->organization_id,
            'pulse_id'              => $args['pulse_id'],
            'matching_events_count' => $recurringEvents->count(),
        ]);

        $primaryInstance = null;

        foreach ($recurringEvents as $recurringEvent) {
            $data = EventInstanceData::from([
                'event_id'          => (string) $recurringEvent->id,
                'pulse_id'          => $args['pulse_id'],
                'local_description' => $args['local_description'] ?? null,
                'priority'          => $args['priority'] ?? null,
                'is_recurring'      => true,
            ]);

            $instance = $this->createEventInstanceAction->handle($data);

            // Keep a reference to the instance for the originally requested event
            if ($recurringEvent->id === $event->id) {
                $primaryInstance = $instance;
            }
        }

        // Return the instance for the originally requested event
        return $primaryInstance ?? $this->createEventInstanceAction->handle(
            EventInstanceData::from($args),
        );
    }

    /**
     * Extract the base event ID from a Google Calendar event ID.
     * Recurring events use the format "baseId_20260121T053000Z".
     */
    private function extractBaseEventId(string $googleEventId): string
    {
        if (str_contains($googleEventId, '_')) {
            $parts = explode('_', $googleEventId);

            return $parts[0];
        }

        return $googleEventId;
    }

    private function validateInput(array &$input): void
    {
        // Normalize empty strings to null for optional fields
        if (isset($input['local_description']) && $input['local_description'] === '') {
            $input['local_description'] = null;
        }
        if (isset($input['priority']) && $input['priority'] === '') {
            $input['priority'] = null;
        }

        $validator = Validator::make($input, [
            'event_id'          => 'required|exists:events,id',
            'pulse_id'          => 'required|exists:pulses,id',
            'local_description' => 'nullable|string|max:1000',
            'priority'          => 'nullable|string|max:50',
            'add_all_instance'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            throw new Error(
                'Validation failed: ' . $validator->errors()->first(),
            );
        }
    }
}
