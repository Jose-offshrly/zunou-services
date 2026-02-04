<?php

namespace App\Policies;

use App\Models\Pulse;
use App\Models\ReplyTeamThread;
use App\Models\User;
use GraphQL\Error\Error;

class ReplyTeamThreadPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view a specific reply team thread.
     */
    public function view(User $user, array $args, ?ReplyTeamThread $replyTeamThread = null): bool
    {
        $replyTeamThread = $this->loadModel($user, $args['input'], ReplyTeamThread::class, $replyTeamThread);
        if (! $replyTeamThread) {
            return throw new Error('Reply team thread not found!');
        }

        $this->checkPulseMembership(user: $user, args: [
            'pulse_id' => $replyTeamThread->teamThread->pulse_id,
        ], model: Pulse::class);

        return $user->hasPermission('read:reply-team-threads') && $user->hasOrganization($replyTeamThread->teamThread->organization_id);
    }

    /**
     * Determine whether the user can create reply team threads.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(user: $user, args: $args['input'], model: Pulse::class);

        return $user->hasPermission('create:reply-team-threads') && $user->hasOrganization($args['input']['organization_id']);
    }
}
