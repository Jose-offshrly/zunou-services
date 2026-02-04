<?php

namespace App\Policies;

use App\Models\Agenda;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class AgendaPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any agendas.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('read:agendas') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view a specific agenda.
     */
    public function view(User $user, array $args, ?Agenda $agenda = null): bool
    {
        $agenda = $this->loadModel($user, $args, Agenda::class, $agenda);
        if (! $agenda) {
            return throw new Error('Agenda not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('read:agendas') && $this->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can create agendas.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('create:agendas') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update a specific agenda.
     */
    public function update(
        User $user,
        array $args,
        ?Agenda $agenda = null,
    ): bool {
        $agenda = $this->loadModel($user, $args, Agenda::class, $agenda);
        if (! $agenda) {
            return throw new Error('Agenda not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $agenda->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('update:agendas') && $user->hasOrganization($agenda->organization_id);
    }

    /**
     * Determine whether the user can delete a specific agenda.
     */
    public function delete(
        User $user,
        array $args,
        ?Agenda $agenda = null,
    ): bool {
        $agenda = $this->loadModel($user, $args, Agenda::class, $agenda);
        if (! $agenda) {
            return throw new Error('Agenda not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $agenda->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('delete:agendas') && $user->hasOrganization($agenda->organization_id);
    }

    /**
     * Determine whether the user can update any agendas (batch update).
     */
    public function updateAny(User $user): bool
    {
        return $user->hasPermission('update:agendas');
    }
}
