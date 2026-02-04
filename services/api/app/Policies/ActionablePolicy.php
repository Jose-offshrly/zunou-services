<?php

namespace App\Policies;

use App\Models\Actionable;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class ActionablePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any actionables.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('read:actionables') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view a specific actionable.
     */
    public function view(
        User $user,
        array $args,
        ?Actionable $actionable = null,
    ): bool {
        $actionable = $this->loadModel(
            $user,
            $args,
            Actionable::class,
            $actionable,
        );
        if (! $actionable) {
            throw new Error('Actionable not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('read:actionables') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can create actionables.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('create:actionables') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update a specific actionable.
     */
    public function update(
        User $user,
        array $args,
        ?Actionable $actionable = null,
    ): bool {
        $actionable = $this->loadModel(
            $user,
            $args,
            Actionable::class,
            $actionable,
        );
        if (! $actionable) {
            throw new Error('Actionable not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $actionable->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('update:actionables') && $user->hasOrganization($actionable->organization_id);
    }

    /**
     * Determine whether the user can delete a specific actionable.
     */
    public function delete(
        User $user,
        array $args,
        ?Actionable $actionable = null,
    ): bool {
        $actionable = $this->loadModel(
            $user,
            $args,
            Actionable::class,
            $actionable,
        );
        if (! $actionable) {
            throw new Error('Actionable not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $actionable->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('delete:actionables') && $user->hasOrganization($actionable->organization_id);
    }
}
