<?php

namespace App\Policies;

use App\Models\DirectMessageThread;
use App\Models\User;

/**
 * @deprecated Part of deprecated DirectMessage system. Use TeamThreadPolicy with ONETOONE pulse category instead.
 */
class DirectMessageThreadPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, ?DirectMessageThread $directMessageThread = null): bool
    {
        // Check if user is a participant in the thread
        return $user->hasPermission('read:direct-messages');

    }
}
