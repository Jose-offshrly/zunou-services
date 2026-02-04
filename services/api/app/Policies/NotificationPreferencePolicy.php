<?php

namespace App\Policies;

use App\Models\NotificationPreference;
use App\Models\User;

class NotificationPreferencePolicy
{
    /**
     * Determine whether the user can view any notification preferences.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('read:notification-preferences');
    }

    /**
     * Determine whether the user can view the notification preference.
     */
    public function view(User $user, NotificationPreference $notificationPreference): bool
    {
        return $user->hasPermission('read:notification-preferences')
            && $notificationPreference->user_id === $user->id;
    }

    /**
     * Determine whether the user can create notification preferences.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('create:notification-preferences');
    }

    /**
     * Determine whether the user can update the notification preference.
     */
    public function update(User $user, NotificationPreference $notificationPreference): bool
    {
        return $user->hasPermission('update:notification-preferences')
            && $notificationPreference->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the notification preference.
     */
    public function delete(User $user, NotificationPreference $notificationPreference): bool
    {
        return $user->hasPermission('delete:notification-preferences')
            && $notificationPreference->user_id === $user->id;
    }
}
