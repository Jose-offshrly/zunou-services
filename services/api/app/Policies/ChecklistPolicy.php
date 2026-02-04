<?php

namespace App\Policies;

use App\Models\Checklist;
use App\Models\Pulse;
use App\Models\User;

class ChecklistPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any checklists.
     */
    public function viewAny(User $user, array $args): bool
    {
        // Only check pulse membership if pulse_id is provided in args
        if (isset($args['pulse_id'])) {
            $this->checkPulseMembership(
                user: $user,
                args: $args,
                model: Pulse::class
            );
        }

        return $user->hasPermission('read:checklists') &&
            $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can view a specific checklist.
     */
    public function view(
        User $user,
        array $args,
        ?Checklist $checklist = null
    ): bool {
        $checklist = $this->loadModel(
            $user,
            $args,
            Checklist::class,
            $checklist
        );
        if (!$checklist) {
            return false;
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $checklist->pulse_id,
            ],
            model: Pulse::class
        );

        return ($user->hasPermission('read:checklists') &&
            $this->hasOrganization($checklist)) ||
            $user->hasPermission('admin:checklists');
    }

    /**
     * Determine whether the user can create checklists.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class
        );

        return $user->hasPermission('create:checklists') &&
            $user->hasOrganization($args['organization_id']);
    }

    /**
     * Determine whether the user can update a specific checklist.
     */
    public function update(
        User $user,
        array $args,
        ?Checklist $checklist = null
    ): bool {
        $checklist = $this->loadModel(
            $user,
            $args,
            Checklist::class,
            $checklist
        );
        if (!$checklist) {
            return false;
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $checklist->pulse_id,
            ],
            model: Pulse::class
        );

        return $user->hasPermission('update:checklists') &&
            $this->hasOrganization($checklist);
    }

    /**
     * Determine whether the user can delete a specific checklist.
     */
    public function delete(
        User $user,
        array $args,
        ?Checklist $checklist = null
    ): bool {
        $checklist = $this->loadModel(
            $user,
            $args,
            Checklist::class,
            $checklist
        );
        if (!$checklist) {
            return false;
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $checklist->pulse_id,
            ],
            model: Pulse::class
        );

        return ($user->hasPermission('delete:checklists') &&
            $this->hasOrganization($checklist)) ||
            $user->hasPermission('admin:checklists');
    }

    /**
     * Determine whether the user can update any checklists (batch update).
     */
    public function updateAny(User $user): bool
    {
        return $user->hasPermission('update:checklists');
    }
}
