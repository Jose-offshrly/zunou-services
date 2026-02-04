<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ThreadPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:threads') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, array $args, Thread $thread = null): bool
    {
        $thread = $this->loadModel($user, $args, Thread::class, $thread);
        if (! $thread && ! $thread->pulse->isMember($user)) {
            return false;
        }

        return ($user->hasPermission('read:threads') && $this->hasOrganization($thread) && $thread->userId === $user->id) || $user->hasPermission('admin:threads'); //users can only read their own threads
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class);
        if (! $pulse->isMember($user)) {
            return false;
        }

        return $user->hasPermission('create:threads');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, array $args, Thread $thread = null): bool
    {
        $thread = $this->loadModel($user, $args, Thread::class, $thread);
        if (! $thread) {
            return false;
        }

        return ($user->hasPermission('update:threads') && $this->hasOrganization($thread) && $thread->user_id === $user->id) || $user->hasPermission('admin:threads');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, array $args, Thread $thread = null): bool
    {
        $thread = $this->loadModel($user, $args, Thread::class, $thread);
        if (! $thread) {
            return false;
        }

        return ($user->hasPermission('delete:threads') && $this->hasOrganization($thread) && $thread->userId === $user->id) || $user->hasPermission('admin:threads');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        array $args,
        Thread $thread = null,
    ): bool {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        array $args,
        Thread $thread = null,
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

        if ($loadedModel == null && isset($args['id'])) {
            $loadedModel = Thread::find($args['id']);
        }
        return $loadedModel;
    }
}
