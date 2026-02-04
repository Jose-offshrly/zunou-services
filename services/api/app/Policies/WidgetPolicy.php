<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Widget;

class WidgetPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any  models
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('read:widgets');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('create:widgets');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?Widget $widget = null,
    ): bool {
        $widget = $this->loadModel($user, $args, Widget::class, $widget);

        if (! $widget) {
            throw new \Error('Widget not found!');
        }

        if ($user->id != $widget->user_id) {
            return false;
        }

        return $user->hasPermission('delete:widgets');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?Widget $widget = null,
    ): bool {
        $widget = $this->loadModel($user, $args, Widget::class, $widget);

        if (! $widget) {
            throw new \Error('Widget not found!');
        }

        if ($user->id != $widget->user_id) {
            return false;
        }

        return $user->hasPermission('update:widgets');
    }

    /**
     * Determine whether the user can update any model.
     */
    public function updateAny(
        User $user,
        array $args,
        ?Widget $widget = null,
    ): bool {
        return $user->hasPermission('update:widgets');
    }
}
