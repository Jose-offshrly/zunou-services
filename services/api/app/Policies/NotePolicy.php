<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class NotePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any notes.
     */
    public function viewAny(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('read:notes') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view a specific note.
     */
    public function view(User $user, array $args, ?Note $note = null): bool
    {
        $note = $this->loadModel($user, $args, Note::class, $note);
        if (! $note) {
            return throw new Error('Note not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $note->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:notes') && $user->hasOrganization($note->organization_id);
    }

    /**
     * Determine whether the user can create notes.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return $user->hasPermission('create:notes') && $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update a specific note.
     */
    public function update(User $user, array $args, ?Note $note = null): bool
    {
        $note = $this->loadModel($user, $args, Note::class, $note);
        if (! $note) {
            return throw new Error('Note not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $note->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:notes') && $user->hasOrganization($note->organization_id);
    }

    /**
     * Determine whether the user can delete a specific note.
     */
    public function delete(User $user, array $args, ?Note $note = null): bool
    {
        $note = $this->loadModel($user, $args, Note::class, $note);
        if (! $note) {
            return throw new Error('Note not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $note->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:notes') && $user->hasOrganization($note->organization_id);
    }

    public function deleteAny(User $user): bool
    {
        return $user->hasPermission('delete:notes');
    }

    /**
     * Determine whether the user can update any notes (batch update).
     */
    public function updateAny(User $user): bool
    {
        return $user->hasPermission('update:notes');
    }
}
