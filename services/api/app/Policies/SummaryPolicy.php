<?php

namespace App\Policies;

use App\Models\Summary;
use App\Models\User;

class SummaryPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, Summary $summary = null): bool
    {
        $summary = $this->loadModel($user, $args, Summary::class, $summary);

        if (! $summary) {
            return false;
        }
        return $user->hasPermission('read:summaries');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Summary $summary = null,
    ): bool {
        $summary = $this->loadModel(
            $user,
            $args['input'],
            Summary::class,
            $summary,
        );
        if (! $summary) {
            return false;
        }

        return $user->hasPermission('update:summaries');
    }
}
