<?php

namespace App\Policies;

use App\Models\User;

class TranscriptPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view a specific model.
     */
    public function view(User $user): bool
    {
        return $user->hasPermission('read:transcripts');
    }
}
