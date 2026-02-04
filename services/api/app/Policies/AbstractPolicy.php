<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

abstract class AbstractPolicy
{
    protected Organization $organization;

    protected User $user;

    protected function hasOrganization(?Model $model): bool
    {
        if ($model === null) {
            return false;
        }

        return isset($model->organization_id) && $this->user->hasOrganization($model->organization_id);
    }

    protected function hasPulse(?Model $model): bool
    {
        if ($model === null) {
            return false;
        }

        return isset($model->pulse_id) && $this->user->hasPulse($model->pulse_id);
    }

    public function checkPulseMembership(
        User $user,
        array $args,
        string $model,
    ): bool {
        $pulse = $this->loadModel($user, $args, $model);
        if (! $pulse) {
            return throw new Error('Pulse not found!');
        }

        if (! $pulse->isMember($user)) {
            return throw new Error('User is not member of the given pulse');
        }

        return true;
    }

    /**
     * Dynamically load a model instance based on provided arguments.
     */
    protected function loadModel(
        User $user,
        array $args,
        string $modelClass,
        ?Model $model = null,
    ): ?Model {
        $this->user = $user;

        if (isset($args['organization_id'])) {
            $this->organization = Organization::find($args['organization_id']);
        } elseif (isset($args['organizationId'])) {
            $this->organization = Organization::find($args['organizationId']);
        } elseif (isset($args['lastOrganizationId'])) {
            $this->organization = Organization::find(
                $args['lastOrganizationId'],
            );
        }

        if ($model !== null) {
            return $model;
        }

        if (isset($args['id'])) {
            return $modelClass::find($args['id']);
        }

        // Attempt to find the model by ID in the provided arguments
        $identifierKey = Str::snake(class_basename($modelClass)) . '_id';
        if (isset($args[$identifierKey])) {
            return $modelClass::find($args[$identifierKey]);
        }

        $identifierKey = Str::camel(class_basename($modelClass)) . 'Id';
        if (isset($args[$identifierKey])) {
            return $modelClass::find($args[$identifierKey]);
        }

        return null;
    }
}
