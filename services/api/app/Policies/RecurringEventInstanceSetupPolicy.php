<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\RecurringEventInstanceSetup;
use App\Models\User;
use GraphQL\Error\Error;

class RecurringEventInstanceSetupPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can create a recurring event instance setup.
     * Requires pulse membership.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args, model: Pulse::class);

        return true;
    }

    /**
     * Determine whether the user can update a recurring event instance setup.
     * Requires membership in the setup's pulse.
     */
    public function update(User $user, array $args, ?RecurringEventInstanceSetup $setup = null): bool
    {
        return $this->authorizeSetupAccess($user, $args, $setup);
    }

    /**
     * Determine whether the user can delete a recurring event instance setup.
     * Requires membership in the setup's pulse.
     */
    public function delete(User $user, array $args, ?RecurringEventInstanceSetup $setup = null): bool
    {
        return $this->authorizeSetupAccess($user, $args, $setup);
    }

    private function authorizeSetupAccess(User $user, array $args, ?RecurringEventInstanceSetup $setup): bool
    {
        $setup = $this->loadModel($user, $args, RecurringEventInstanceSetup::class, $setup)
            ?? (isset($args['setupId']) ? RecurringEventInstanceSetup::find($args['setupId']) : null);

        if (! $setup) {
            throw new Error('Recurring event instance setup not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $setup->pulse_id,
        ], model: Pulse::class);

        return true;
    }
}
