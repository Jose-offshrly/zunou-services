<?php

namespace App\Policies;

use App\Models\OrganizationGroup;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

class OrganizationGroupPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any  models
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('read:organization-groups');
    }

    /**
     * Determine whether the user can view a specific model.
     */
    public function view(
        User $user,
        array $args,
        ?OrganizationGroup $organizationGroup = null,
    ): bool {
        $organizationGroup = $this->loadModel(
            $user,
            $args,
            OrganizationGroup::class,
            $organizationGroup,
        );
        if (! $organizationGroup) {
            return throw new Error('Group not found!');
        }

        return $user->hasPermission('read:organization-groups');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class, null);

        if (! $pulse || ! $pulse->userHasRole($user, ['owner', 'admin'])) {
            return false;
        }

        return $user->hasPermission('create:organization-groups');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?OrganizationGroup $organizationGroup = null,
    ): bool {
        $organizationGroup = $this->loadModel(
            $user,
            $args['input'],
            OrganizationGroup::class,
            $organizationGroup,
        );

        // Load the pulse model from the organization group
        $pulse = $organizationGroup->pulse ?? null;

        if (! $organizationGroup) {
            Log::info('Group not found!');
            throw new Error('Group not found!');
        }

        if (! $pulse || ! $pulse->userHasRole($user, ['owner', 'admin', 'user'])) {
            return false;
        }

        return $user->hasPermission('update:organization-groups');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?OrganizationGroup $organizationGroup = null,
    ): bool {
        $organizationGroup = $this->loadModel(
            $user,
            $args,
            OrganizationGroup::class,
            $organizationGroup,
        );

        // Load the pulse model from the organization group
        $pulse = $organizationGroup->pulse ?? null;

        if (! $organizationGroup) {
            Log::info('Group not found!');
            throw new Error('Group not found!');
        }

        if (! $pulse || ! $pulse->userHasRole($user, ['owner', 'admin'])) {
            return false;
        }

        return $user->hasPermission('delete:organization-groups');
    }
}
