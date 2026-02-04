<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class UserPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:users');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, User $model = null): bool
    {
        // Admin users can view anyone (this includes the M2M user).
        if ($user->hasPermission('admin:users')) {
            return true;
        }

        $model = $this->loadModel($user, $args, User::class, $model);

        if (! $model) {
            Log::warning('No model found to view', [
                'user_id' => $user->id,
                'args'    => $args,
            ]);
            return false;
        }

        // Retrieve organization IDs explicitly from the organizations table
        $userOrganizations = $user
            ->organizations()
            ->select('organizations.id')
            ->pluck('organizations.id')
            ->toArray();
        $modelOrganizations = $model
            ->organizations()
            ->select('organizations.id')
            ->pluck('organizations.id')
            ->toArray();

        // Check if users share any organizations
        $sharedOrganizations = array_intersect(
            $userOrganizations,
            $modelOrganizations,
        );

        Log::info('Shared organizations', [
            'shared_organizations' => $sharedOrganizations,
        ]);

        // Allow access if there's at least one shared organization and the user has permission
        return count($sharedOrganizations) > 0 && $user->hasPermission('read:users');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        return $user->hasPermission('create:users') || $user->hasPermission('admin:users');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, User $model = null): bool
    {
        $model = $this->loadModel($user, $args, User::class, $model);
        if (! $model) {
            return false;
        }

        return ($user && $model && $user->hasPermission('read:users') && $user->id === $model->id) || ($user && $user->hasPermission('admin:users'));
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, array $args, User $model = null): bool
    {
        $model = $this->loadModel($user, $args, User::class, $model);
        if (! $model) {
            return false;
        }

        if (! $user) {
            Log::error('User is null');
        }

        return ($user->hasPermission('delete:users') && $user->id === $model->id) || $user->hasPermission('admin:users');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, array $args, User $model = null): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        User $model = null,
    ): bool {
        return false;
    }

    /**
     * Dynamically load a model instance based on provided arguments.
     */
    protected function loadModel(
        User $user,
        array $args,
        string $modelClass,
        Model $model = null,
    ): ?Model {
        $loadedModel = parent::loadModel($user, $args, $modelClass, $model);

        if ($loadedModel == null && isset($args['slackId'])) {
            $loadedModel = User::where([
                'slack_id' => $args['slackId'],
            ])->first();
        }

        if ($loadedModel == null) {
            // If we weren't given an ID, we're dealing with the current user.
            return $user;
        }

        return $loadedModel;
    }
}
