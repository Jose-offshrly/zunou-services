<?php

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;

class SettingPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any pulses.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:settings') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        ?Setting $setting = null,
    ): bool {
        $setting = $this->loadModel($user, $args, Setting::class, $setting);
        if (! $setting) {
            throw new \Error('Setting not found!');
        }

        if ($user->id !== $setting->user_id) {
            throw new \Error('You are not allowed to view this setting!');
        }

        return $user->hasPermission('read:settings');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('create:settings');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Setting $setting = null,
    ): bool {
        $setting = $this->loadModel($user, $args, Setting::class, $setting);
        if (! $setting) {
            throw new \Error('User setting not found!');
        }

        if ($user->id !== $setting->user_id) {
            throw new \Error('You are not allowed to update this setting!');
        }

        return $user->hasPermission('update:settings');
    }
}
