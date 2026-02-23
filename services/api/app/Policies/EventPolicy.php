<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class EventPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any events.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:events') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific event.
     * Uses event_owners to check ownership via User or Pulse membership.
     */
    public function view(User $user, array $args, ?Event $event = null): bool
    {
        $event = $this->loadModel($user, $args, Event::class, $event);
        if (! $event) {
            return throw new Error('Event not found!');
        }

        $this->checkEventOwnership($user, $event);

        return $user->hasPermission('read:events') && $user->hasOrganization($event->organization_id);
    }

    /**
     * Determine whether the user can create events.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:events') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can list events they attend across an organization.
     * Used by myAttendeeEvents query — no pulse membership required.
     */
    public function viewAttendeeEvents(User $user, array $args): bool
    {
        return $user->hasPermission('read:events') && $user->hasOrganization($args['organizationId']);
    }

    public function massCreate(User $user, array $args): bool
    {
        // Only check pulse membership if pulse_id is provided
        // When no pulse_id is provided, events will be created in all personal pulses
        if (isset($args['input']['pulseId'])) {
            $this->checkPulseMembership(user: $user, args: [
                'pulse_id' => $args['input']['pulseId'],
            ], model: Pulse::class);

            // When pulse_id is provided, organization_id should also be provided
            if (! isset($args['input']['organizationId'])) {
                throw new \GraphQL\Error\Error('Organization ID is required when pulse ID is provided');
            }

            return $user->hasPermission('create:events') && $user->hasOrganization($args['input']['organizationId']);
        }

        // When no pulse_id is provided, just check general create permission
        // The mutation will handle authorization for each personal pulse
        return $user->hasPermission('create:events');
    }

    /**
     * Determine whether the user can update a specific event.
     */
    public function update(User $user, array $args, ?Event $event = null): bool
    {
        $event = $this->loadModel($user, $args, Event::class, $event);
        if (! $event) {
            return throw new Error('Event not found!');
        }

        return $user->hasPermission('update:events') && $user->hasOrganization($event->organization_id);
    }

    /**
     * Determine whether the user can delete a specific event.
     * Uses event_owners to check ownership via User or Pulse membership.
     */
    public function delete(User $user, array $args, ?Event $event = null): bool
    {
        $event = $this->loadModel($user, $args, Event::class, $event);
        if (! $event) {
            return throw new Error('Event not found!');
        }

        $this->checkEventOwnership($user, $event);

        return $user->hasPermission('delete:events') && $user->hasOrganization($event->organization_id);
    }

    /**
     * Check that the user owns the event, either directly (as a User owner)
     * or via membership in a Pulse that owns the event.
     */
    private function checkEventOwnership(User $user, Event $event): bool
    {
        // Check if user is a direct owner
        $isDirectOwner = $event->eventOwner()
            ->where('entity_type', User::class)
            ->where('entity_id', $user->id)
            ->exists();

        if ($isDirectOwner) {
            return true;
        }

        // Check if user is a member of any pulse that owns the event
        $ownerPulseIds = $event->eventOwner()
            ->where('entity_type', Pulse::class)
            ->pluck('entity_id');

        if ($ownerPulseIds->isEmpty()) {
            // Fallback: if no event_owners exist yet (legacy data), check the old pulse_id column
            if ($event->pulse_id) {
                $this->checkPulseMembership(user: $user, args: [
                    'pulse_id' => $event->pulse_id,
                ], model: Pulse::class);

                return true;
            }

            throw new Error('Event has no owners');
        }

        $isMemberOfOwnerPulse = $user->pulseMemberships()
            ->whereIn('pulse_id', $ownerPulseIds)
            ->exists();

        if (! $isMemberOfOwnerPulse) {
            throw new Error('User is not member of the given pulse');
        }

        return true;
    }
}
