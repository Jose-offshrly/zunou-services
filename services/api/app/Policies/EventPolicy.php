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
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:events') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific event.
     */
    public function view(User $user, array $args, ?Event $event = null): bool
    {
        $event = $this->loadModel($user, $args, Event::class, $event);
        if (! $event) {
            return throw new Error('Event not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $event->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:events') && $user->hasOrganization($event->organization_id);
    }

    /**
     * Determine whether the user can create events.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:events') && $user->hasOrganization($args['organization_id']);
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

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $event->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:events') && $user->hasOrganization($event->organization_id);
    }

    /**
     * Determine whether the user can delete a specific event.
     */
    public function delete(User $user, array $args, ?Event $event = null): bool
    {
        $event = $this->loadModel($user, $args, Event::class, $event);
        if (! $event) {
            return throw new Error('Event not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $event->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:events') && $user->hasOrganization($event->organization_id);
    }
}
