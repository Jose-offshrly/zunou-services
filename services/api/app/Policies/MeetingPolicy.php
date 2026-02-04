<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class MeetingPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:meetings');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?Meeting $meeting = null): bool
    {
        $meeting = $this->loadModel($user, $args, Meeting::class, $meeting);
        if (! $meeting) {
            return throw new Error('Meeting not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $meeting->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:meetings') && $user->id === $meeting->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:meetings');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Meeting $meeting = null,
    ): bool {
        $meeting = $this->loadModel($user, $args, Meeting::class, $meeting);
        if (! $meeting) {
            return throw new Error('Meeting not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $meeting->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:meetings') && $user->id === $meeting->user_id;
    }

    /**
     * Determine whether the user can delete a specific meeting.
     */
    public function delete(User $user, array $args, ?Meeting $meeting = null): bool
    {
        $meeting = $this->loadModel($user, $args, Meeting::class, $meeting);
        if (! $meeting) {
            return throw new Error('Meeting not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $meeting->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:meetings') && $user->id === $meeting->user_id;
    }
}
