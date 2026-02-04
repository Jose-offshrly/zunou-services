<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\TeamMessage;
use App\Models\TeamThread;
use App\Models\User;
use GraphQL\Error\Error;

class TeamMessagePolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any team messages.
     */
    public function viewAny(User $user, array $args): bool
    {
        return $user->hasPermission('read:team-messages') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific team message.
     */
    public function view(User $user, array $args, ?TeamMessage $teamMessage = null): bool
    {
        $teamMessage = $this->loadModel($user, $args, TeamMessage::class, $teamMessage);
        if (! $teamMessage) {
            return throw new Error('Team message not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $teamMessage->teamThread->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:team-messages') && $user->hasOrganization($teamMessage->teamThread->organization_id);
    }

    /**
     * Determine whether the user can create team messages.
     */
    public function create(User $user, array $args): bool
    {
        // Load the team thread to get pulse information
        $teamThread = TeamThread::find($args['input']['teamThreadId']);
        if (! $teamThread) {
            return throw new Error('Team thread not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $teamThread->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('create:team-messages') && $user->hasOrganization($teamThread->organization_id);
    }

    /**
     * Determine whether the user can update a specific team message.
     */
    public function update(
        User $user,
        array $args,
        ?TeamMessage $teamMessage = null,
    ): bool {
        $teamMessage = $this->loadModel(
            $user,
            $args['input'],
            TeamMessage::class,
            $teamMessage,
        );
        if (! $teamMessage) {
            return throw new Error('Team message not found!');
        }

        // Check if user owns the message
        if ($teamMessage->user_id !== $user->id) {
            return throw new Error('You can only update your own messages!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $teamMessage->teamThread->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('update:team-messages') && $user->hasOrganization($teamMessage->teamThread->organization_id);
    }

    /**
     * Determine whether the user can delete a specific team message.
     */
    public function delete(
        User $user,
        array $args,
        ?TeamMessage $teamMessage = null,
    ): bool {
        $teamMessage = $this->loadModel(
            $user,
            $args['input'],
            TeamMessage::class,
            $teamMessage,
        );
        if (! $teamMessage) {
            return throw new Error('Team message not found!');
        }

        // Check if user owns the message
        if ($teamMessage->user_id !== $user->id) {
            return throw new Error('You can only delete your own messages!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $teamMessage->teamThread->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('delete:team-messages') && $user->hasOrganization($teamMessage->teamThread->organization_id);
    }
}
