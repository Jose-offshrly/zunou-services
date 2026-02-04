<?php

namespace App\Policies;

use App\Models\LiveInsightOutbox;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;

class LiveInsightOutboxPolicy extends AbstractPolicy
{
    /**
     * List access: scoped by builder to the caller's user_id.
     * We only enforce org membership (if provided) + permission.
     */
    public function viewAny(User $user, array $args): bool
    {
        $orgArg = $args['organizationId'] ?? $args['organization_id'] ?? null;

        if ($orgArg && !$user->hasOrganization($orgArg)) {
            throw new Error('Forbidden: not in organization.');
        }

        return $user->hasPermission('read:insights');
    }

    /**
     * Single row read: must own the row unless admin.
     */
    public function view(User $user, array $args, ?LiveInsightOutbox $row = null): bool
    {
        $row = $this->loadModel($user, $args, LiveInsightOutbox::class, $row);
        if (!$row) {
            throw new Error('Insight not found!');
        }

        if ($row->user_id !== $user->id && !$user->hasPermission('admin:users')) {
            throw new Error('Forbidden: cannot view this insight.');
        }

        // Extra tenancy fence: must belong to the same pulse/organization
        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $row->pulse_id],
            model: Pulse::class,
        );

        return $user->hasPermission('read:insights');
    }

    /**
     * Update: must own the row unless admin.
     */
    public function update(User $user, array $args, ?LiveInsightOutbox $row = null): bool
    {
        $row = $this->loadModel($user, $args, LiveInsightOutbox::class, $row);
        if (!$row) {
            throw new Error('Insight not found!');
        }

        if ($row->user_id !== $user->id && !$user->hasPermission('admin:users')) {
            throw new Error('Forbidden: cannot modify this insight.');
        }

        $this->checkPulseMembership(
            user: $user,
            args: ['pulse_id' => $row->pulse_id],
            model: Pulse::class,
        );

        return $user->hasPermission('update:insights');
    }
}
