<?php

namespace App\Policies;

use App\Models\Label;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class LabelPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any labels.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:labels');
    }

    /**
     * Determine whether the user can view a specific label.
     */
    public function view(User $user, array $args, ?Label $label = null): bool
    {
        $label = $this->loadModel($user, $args, Label::class, $label);
        if (! $label) {
            return throw new Error('Label not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $label->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:labels');
    }

    /**
     * Determine whether the user can create labels.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:labels');
    }

    /**
     * Determine whether the user can update a specific label.
     */
    public function update(User $user, array $args, ?Label $label = null): bool
    {
        $label = $this->loadModel($user, $args, Label::class, $label);
        if (! $label) {
            return throw new Error('Label not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $label->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:labels');
    }

    /**
     * Determine whether the user can delete a specific label.
     */
    public function delete(User $user, array $args, ?Label $label = null): bool
    {
        $label = $this->loadModel($user, $args, Label::class, $label);
        if (! $label) {
            return throw new Error('Label not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $label->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:labels');
    }
} 