<?php

namespace App\Policies;

use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

class MeetingSessionPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, array $args): bool
    {
        if ($args['origin'] != 'VITALS' && ! empty($args['pulseId'])) {
            $this->checkPulseMembership(
                user: $user,
                args: $args,
                model: Pulse::class,
            );
        }

        return $user->hasPermission('read:meeting-sessions') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can view a specific meeting session.
     */
    public function view(
        User $user,
        array $args,
        ?MeetingSession $meetingSession = null,
    ): bool {
        $meetingSession = $this->loadModel(
            $user,
            $args,
            MeetingSession::class,
            $meetingSession,
        );
        if (! $meetingSession) {
            return throw new Error('Meeting Session not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $meetingSession->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('read:meeting-sessions') && $user->hasOrganization($meetingSession->organization_id);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, array $args): bool
    {
        $this->checkPulseMembership(
            user: $user,
            args: $args,
            model: Pulse::class,
        );

        return $user->hasPermission('create:meeting-sessions') && $user->hasOrganization($args['organizationId']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        ?MeetingSession $meetingSession = null,
    ): bool {
        $meetingSession = $this->loadModel(
            $user,
            $args['input'] ?? $args,
            MeetingSession::class,
            $meetingSession,
        );

        if (! $meetingSession) {
            throw new Error('Meeting Session not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $meetingSession->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('update:meeting-sessions') && $user->hasOrganization($meetingSession->organization_id);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        array $args,
        ?MeetingSession $meetingSession = null,
    ): bool {
        $meetingSession = $this->loadModel(
            $user,
            $args,
            MeetingSession::class,
            $meetingSession,
        );

        if (! $meetingSession) {
            return throw new Error('Meeting Session not found!');
        }

        $this->checkPulseMembership(
            user: $user,
            args: [
                'pulse_id' => $meetingSession->pulse_id,
            ],
            model: Pulse::class,
        );

        return $user->hasPermission('delete:meeting-sessions') && $user->hasOrganization($meetingSession->organization_id);
    }
}
