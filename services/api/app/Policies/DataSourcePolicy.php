<?php

namespace App\Policies;

use App\Models\DataSource;
use App\Models\User;

class DataSourcePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:data-sources');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(
        User $user,
        array $args,
        ?DataSource $dataSource = null,
    ): bool {
        $dataSource = $this->loadModel(
            $user,
            $args,
            DataSource::class,
            $dataSource,
        );

        if (
            ! $dataSource || ! $user->organizations->contains('id', $dataSource->organization_id)
        ) {
            return false;
        }

        return ($user->hasPermission('read:data-sources') && $this->hasOrganization($dataSource) && $this->hasPulse($dataSource)) || $user->hasPermission('admin:data-sources');
    }

    /**
     * Determine whether the user can stream the model.
     */
    public function stream(User $user, DataSource $dataSource, $args = []): bool
    {
        $dataSource = $this->loadModel(
            $user,
            $args,
            DataSource::class,
            $dataSource,
        );

        if (
            ! $dataSource || ! $user->organizations->contains('id', $dataSource->organization_id)
        ) {
            return false;
        }

        return $user->hasPermission('read:data-sources') && $this->hasOrganization($dataSource) && $this->hasPulse($dataSource);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:data-sources') && $user->hasOrganization($args['organization_id']) && $user->hasPulse($args['pulse_id']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?DataSource $dataSource = null,
    ): bool {
        $dataSource = $this->loadModel(
            $user,
            $args,
            DataSource::class,
            $dataSource,
        );
        if (! $dataSource) {
            return false;
        }

        return ($user->hasPermission('update:data-sources') && $this->hasOrganization($dataSource) && $this->hasPulse($dataSource)) || $user->hasPermission('admin:data-sources');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?DataSource $dataSource = null,
    ): bool {
        $dataSource = $this->loadModel(
            $user,
            $args,
            DataSource::class,
            $dataSource,
        );
        if (! $dataSource) {
            return false;
        }

        return ($user->hasPermission('delete:data-sources') && $this->hasOrganization($dataSource) && $this->hasPulse($dataSource)) || $user->hasPermission('admin:data-sources');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        array $args,
        ?DataSource $dataSource = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        ?DataSource $dataSource = null,
    ): bool {
        return false;
    }
}
