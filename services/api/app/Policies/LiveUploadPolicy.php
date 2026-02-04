<?php

namespace App\Policies;

use App\Models\LiveUpload;
use App\Models\User;

class LiveUploadPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:liveUploads') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        LiveUpload $liveUpload = null,
    ): bool {
        $liveUpload = $this->loadModel(
            $user,
            $args,
            LiveUpload::class,
            $liveUpload,
        );
        if (! $liveUpload) {
            return false;
        }

        return ($liveUpload && $user->id === $liveUpload->user_id && $user->hasPermission('read:liveUploads')) || $user->hasPermission('admin:liveUploads');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:liveUploads') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        LiveUpload $liveUpload = null,
    ): bool {
        $liveUpload = $this->loadModel(
            $user,
            $args,
            LiveUpload::class,
            $liveUpload,
        );
        if (! $liveUpload) {
            return false;
        }

        return ($liveUpload && $user->id === $liveUpload->user_id && $user->hasPermission('update:liveUploads')) || $user->hasPermission('admin:liveUploads');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        LiveUpload $liveUpload = null,
    ): bool {
        $liveUpload = $this->loadModel(
            $user,
            $args,
            LiveUpload::class,
            $liveUpload,
        );
        if (! $liveUpload) {
            return false;
        }

        return ($liveUpload && $user->id === $liveUpload->user_id && $user->hasPermission('delete:liveUploads')) || $user->hasPermission('admin:liveUploads');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        array $args,
        LiveUpload $liveUpload = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        LiveUpload $liveUpload = null,
    ): bool {
        return false;
    }
}
