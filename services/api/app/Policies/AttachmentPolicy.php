<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\User;
use GraphQL\Error\Error;

class AttachmentPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can create a new model.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:attachments');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        ?Attachment $attachment = null
    ): bool {
        $attachment = $this->loadModel(
            $user,
            $args,
            Attachment::class,
            $attachment
        );
        if (!$attachment) {
            return throw new Error('Attachment not found!');
        }

        return $user->hasPermission('read:attachments');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Attachment $attachment = null
    ): bool {
        $attachment = $this->loadModel(
            $user,
            $args,
            Attachment::class,
            $attachment
        );
        if (!$attachment) {
            return throw new Error('Attachment not found!');
        }

        return $user->hasPermission('update:attachments');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?Attachment $attachment = null
    ): bool {
        $attachment = $this->loadModel(
            $user,
            $args,
            Attachment::class,
            $attachment
        );
        if (!$attachment) {
            return throw new Error('Attachment not found!');
        }

        return $user->hasPermission('delete:attachments');
    }
}
