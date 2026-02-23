<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\Event\CreateEventInstanceAction;
use App\Actions\Event\CreateEventOwnerAction;
use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Models\Event;
use App\Models\EventInstance;
use App\Models\EventOwner;
use App\Models\Pulse;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class AddEventToPulseMutation
{
    public function __construct(
        private CreateEventInstanceAction $createEventInstanceAction,
        private CreateEventOwnerAction $createEventOwnerAction,
    ) {}

    /**
     * Add an existing event to a pulse by creating an EventInstance and EventOwner.
     * Used by the Pulse Manager modal when a user selects a meeting to add.
     */
    public function __invoke(null $_, array $args): EventInstance
    {
        $user = Auth::user();

        if (! $user) {
            throw new Error('User not authenticated.');
        }

        $eventId = $args['event_id'];
        $pulseId = $args['pulse_id'];

        $event = Event::find($eventId);

        if (! $event) {
            throw new Error('Event not found.');
        }

        $pulse = Pulse::find($pulseId);

        if (! $pulse) {
            throw new Error('Pulse not found.');
        }

        // Verify the pulse belongs to the same organization as the event
        if ($pulse->organization_id !== $event->organization_id) {
            throw new Error('Pulse and event must belong to the same organization.');
        }

        // Verify user is a member of the pulse
        $isMember = $pulse->members()->where('user_id', $user->id)->exists();

        if (! $isMember) {
            throw new Error('You must be a member of this pulse to add events to it.');
        }

        // Verify user is an attendee of the event (by email in guests or Attendee record)
        $isAttendee = $this->userIsAttendee($user, $event);

        if (! $isAttendee) {
            throw new Error('You can only add events where you are an attendee.');
        }

        // Check if EventInstance already exists for this event+pulse
        $existingInstance = EventInstance::where('event_id', $eventId)
            ->where('pulse_id', $pulseId)
            ->first();

        if ($existingInstance) {
            return $existingInstance;
        }

        // Create EventOwner linking event to the pulse (if not exists)
        $ownerExists = EventOwner::where('event_id', $event->id)
            ->where('entity_type', Pulse::class)
            ->where('entity_id', $pulse->id)
            ->exists();

        if (! $ownerExists) {
            $this->createEventOwnerAction->handle(
                event: $event,
                eventable: $pulse,
            );
        }

        // Create EventInstance linking event to the pulse
        $eventInstanceData = EventInstanceData::from([
            'event_id'          => (string) $event->id,
            'pulse_id'          => (string) $pulse->id,
            'local_description' => null,
            'priority'          => null,
        ]);

        $eventInstance = $this->createEventInstanceAction->handle(data: $eventInstanceData);

        Log::info('Event added to pulse via Pulse Manager', [
            'user_id'  => $user->id,
            'event_id' => $event->id,
            'pulse_id' => $pulse->id,
        ]);

        return $eventInstance;
    }

    /**
     * Check if the user is an attendee of the event.
     */
    private function userIsAttendee($user, Event $event): bool
    {
        // Check guests JSON array for user's email
        $guests = $event->guests ?? [];

        if (in_array($user->email, $guests, true)) {
            return true;
        }

        // Check Attendee relationship
        return $event->attendees()->where('user_id', $user->id)->exists();
    }
}
