<?php

namespace App\Policies;

use App\Enums\PulseMemberRole;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\PulseMember;
use App\Models\User;

class PulseMemberPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view the pulse member.
     */
    public function view(User $user, array $args): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class);
        if (! $pulse) {
            return false;
        }

        return $pulse->userHasRole($user, [PulseMemberRole::OWNER->value]);
    }

    /**
     * Determine whether the user can view any pulse members.
     */
    public function viewAny(User $user, array $args): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class);
        if (! $pulse) {
            return false;
        }

        return $pulse->userHasRole($user, [
            PulseMemberRole::OWNER->value,
            PulseMemberRole::ADMIN->value,
            PulseMemberRole::STAFF->value,
            PulseMemberRole::GUEST->value,
        ]);
    }

    /**
     * Determine whether the user can view pulse members by organization.
     */
    public function viewOrgMembers(User $user, array $args): bool
    {
        // If organizationId is not provided, deny access
        if (empty($args['organizationId'])) {
            return false;
        }

        // Load the organization
        $organization = $this->loadModel($user, $args, Organization::class);
        if (! $organization) {
            return false;
        }

        // Check if user belongs to this organization
        $hasReadPermission     = $user->hasPermission('read:organizations');
        $belongsToOrganization = $user->hasOrganization($organization->id);
        $hasAdminPermission    = $user->hasPermission('admin:organizations');
        $hasManagePermission   = $user->hasPermission('manage:organizations');

        return ($hasReadPermission && $belongsToOrganization) || $hasAdminPermission || $hasManagePermission;
    }

    /**
     * Determine whether the user can create pulses.
     */
    public function create(User $user, array $args): bool
    {
        $pulse = $this->loadModel($user, $args, Pulse::class);
        if (! $pulse) {
            return false;
        }

        return $pulse->userHasRole($user, [
            PulseMemberRole::OWNER->value,
            PulseMemberRole::ADMIN->value,
        ]);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?PulseMember $pulseMember = null,
    ): bool {
        $pulseMember = $this->loadModel(
            $user,
            $args['input'],
            PulseMember::class,
            $pulseMember,
        );

        if (! $pulseMember) {
            return false;
        }

        $role = $pulseMember->role->value;

        $isPrivilegedRole = in_array($role, ['OWNER', 'ADMIN']);
        $hasUpdatePermission = $user->hasPermission('update:pulse-member') && $this->hasOrganization($pulseMember);
        $isAdmin = $user->hasPermission('admin:pulses');

        return $hasUpdatePermission || $isAdmin || $isPrivilegedRole;
    }

    /**
     * Determine whether the user can delete the pulse.
     */
    public function delete(
        User $user,
        array $args,
        ?PulseMember $pulseMember = null,
    ): bool {
        $pulseMember = $this->loadModel(
            $user,
            $args,
            PulseMember::class,
            $pulseMember,
        );
        if (! $pulseMember) {
            return false;
        }

        return $user->hasPermission('delete:pulse-member');
    }
}
