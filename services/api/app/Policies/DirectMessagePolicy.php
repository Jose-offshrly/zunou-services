<?php

namespace App\Policies;

use App\Models\DirectMessage;
use App\Models\User;

class DirectMessagePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:direct-messages');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?DirectMessage $directMessage = null): bool
    {
        $directMessage = $this->loadModel($user, $args, DirectMessage::class, $directMessage);
        if (! $directMessage) {
            return false;
        }

        // Check if user is a participant in the thread
        if (! $this->isParticipant($user, $directMessage)) {
            return false;
        }

        return $user->hasPermission('read:direct-messages') || $user->hasPermission('admin:direct-messages');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:direct-messages');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, ?DirectMessage $directMessage = null): bool
    {
        $directMessage = $this->loadModel($user, $args['input'] ?? $args, DirectMessage::class, $directMessage);
        if (! $directMessage) {
            return false;
        }

        // Check if user is a participant in the thread
        if (! $this->isParticipant($user, $directMessage)) {
            return false;
        }

        // Only message sender can update their own messages
        if ($user->id !== $directMessage->sender_id) {
            return false;
        }

        return $user->hasPermission('update:direct-messages');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, array $args, ?DirectMessage $directMessage = null): bool
    {
        $directMessage = $this->loadModel($user, $args, DirectMessage::class);
        if (! $directMessage) {
            return false;
        }

        // Check if user is a participant in the thread
        if (! $this->isParticipant($user, $directMessage)) {
            return false;
        }

        // Only message sender can delete their own messages
        if ($user->id !== $directMessage->sender_id) {
            return false;
        }

        return $user->hasPermission('delete:direct-messages') || $user->hasPermission('admin:direct-messages');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, DirectMessage $directMessage): bool
    {
        // Check if user is a participant in the thread
        if (! $this->isParticipant($user, $directMessage)) {
            return false;
        }

        // Only message sender can restore their own messages
        if ($user->id !== $directMessage->sender_id) {
            return false;
        }

        return $user->hasPermission('restore:direct-messages');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, DirectMessage $directMessage): bool
    {
        // Check if user is a participant in the thread
        if (! $this->isParticipant($user, $directMessage)) {
            return false;
        }

        // Only message sender can force delete their own messages
        if ($user->id !== $directMessage->sender_id) {
            return false;
        }

        return $user->hasPermission('force-delete:direct-messages');
    }

    /**
     * Check if the user is a participant in the direct message thread.
     */
    private function isParticipant(User $user, DirectMessage $directMessage): bool
    {
        if (! $directMessage->thread) {
            return false;
        }

        $participants = $directMessage->thread->participants ?? [];

        return in_array($user->id, $participants);
    }
}
