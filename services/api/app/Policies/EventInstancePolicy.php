<?php

namespace App\Policies;

use App\Models\EventInstance;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class EventInstancePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any event instances.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:event-instances');
    }

    /**
     * Determine whether the user can view a specific event instance.
     */
    public function view(User $user, array $args, ?EventInstance $eventInstance = null): bool
    {
        $eventInstance = $this->loadModel($user, $args, EventInstance::class, $eventInstance);
        if (! $eventInstance) {
            return throw new Error('Event instance not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $eventInstance->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:event-instances') && $user->hasOrganization($eventInstance->event->organization_id);
    }

    /**
     * Determine whether the user can create event instances.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:event-instances') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update a specific event instance.
     */
    public function update(User $user, array $args, ?EventInstance $eventInstance = null): bool
    {
        $eventInstance = $this->loadModel($user, $args, EventInstance::class, $eventInstance);
        if (! $eventInstance) {
            return throw new Error('Event instance not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $eventInstance->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:event-instances') && $user->hasOrganization($eventInstance->event->organization_id);
    }

    /**
     * Determine whether the user can delete a specific event instance.
     */
    public function delete(User $user, array $args, ?EventInstance $eventInstance = null): bool
    {
        $eventInstance = $this->loadModel($user, $args, EventInstance::class, $eventInstance);
        if (! $eventInstance) {
            return throw new Error('Event instance not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $eventInstance->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:event-instances') && $user->hasOrganization($eventInstance->event->organization_id);
    }

    /**
     * Determine whether the user can restore a specific event instance.
     */
    public function restore(User $user, array $args, ?EventInstance $eventInstance = null): bool
    {
        $eventInstance = $this->loadModel($user, $args, EventInstance::class, $eventInstance);
        if (! $eventInstance) {
            return throw new Error('Event instance not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $eventInstance->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:event-instances') && $user->hasOrganization($eventInstance->event->organization_id);
    }

    /**
     * Determine whether the user can permanently delete a specific event instance.
     */
    public function forceDelete(User $user, array $args, ?EventInstance $eventInstance = null): bool
    {
        $eventInstance = $this->loadModel($user, $args, EventInstance::class, $eventInstance);
        if (! $eventInstance) {
            return throw new Error('Event instance not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $eventInstance->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:event-instances') && $user->hasOrganization($eventInstance->event->organization_id);
    }
}
