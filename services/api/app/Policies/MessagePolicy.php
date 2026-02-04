<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\Thread;
use App\Models\User;

class MessagePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:threads') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?Message $message = null): bool
    {
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $thread = $this->loadModel($user, $args, Thread::class);
        if ($user->id !== $thread->user_id) {
            return false;
        }

        return $user->hasPermission('create:messages');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Message $message = null,
    ): bool {
        $message = $this->loadModel($user, $args, Message::class, $message);

        if (! $message) {
            return false;
        }

        // Users can only update their own messages
        if ($message->user_id !== $user->id) {
            return false;
        }

        return $user->hasPermission('update:messages');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?Message $message = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        array $args,
        ?Message $message = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        ?Message $message = null,
    ): bool {
        return false;
    }
}
