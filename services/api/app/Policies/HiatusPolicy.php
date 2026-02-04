<?php

namespace App\Policies;

use App\Models\Hiatus;
use App\Models\User;
use Error;
use Illuminate\Support\Facades\Log;

class HiatusPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('create:hiatuses');
    }

    /**
     * Determine whether the user can view a specific pulse.
     */
    public function view(User $user, array $args, ?Hiatus $hiatus = null): bool
    {
        $hiatus = $this->loadModel($user, $args, Hiatus::class, $hiatus);
        if (! $hiatus) {
            throw new Error('Hiatus not found!');
        }

        return $user->hasPermission('read:hiatuses');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, ?Hiatus $hiatus = null): bool
    {
        $hiatus = $this->loadModel($user, $args, Hiatus::class, $hiatus);

        if (! $hiatus) {
            Log::info('Hiatus not found!');
            throw new Error('Hiatus not found!');
        }

        if ($user->id != $hiatus->user_id) {
            throw new Error('Auth user does not own the hiatus');
        }

        return $user->hasPermission('update:hiatuses');
    }
}
