<?php

namespace App\Policies;

use App\Models\Notification;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;

class NotificationPolicy extends AbstractPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function viewAny(User $user, array $args): bool
    {
        $accessThroughPulse = isset($args['pulseId'])
            ? $this->hasAccessThroughPulse($user, null, $args['pulseId'])
            : $user->pulseMemberships()->exists();
        $accessThroughOrganization = isset($args['organizationId'])
            ? $this->hasAccessThroughOrganization(
                $user,
                null,
                $args['organizationId'],
            )
            : false;

        // Grant access if the user is linked via either pulses or organizations
        return ($accessThroughPulse || $accessThroughOrganization) && $user->hasPermission('read:notifications');
    }

    public function view(
        User $user,
        array $args,
        Notification $notification = null,
    ): bool {
        $accessThroughPulse = isset($args['pulseId'])
            ? $this->hasAccessThroughPulse(
                $user,
                $notification,
                $args['pulseId'],
            )
            : false;
        $accessThroughOrganization = isset($args['organizationId'])
            ? $this->hasAccessThroughOrganization(
                $user,
                $notification,
                $args['organizationId'],
            )
            : false;

        // Grant access if the user is linked via either pulses or organizations
        return ($accessThroughPulse || $accessThroughOrganization) && $user->hasPermission('read:notifications');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        array $args,
        Notification $notification = null,
    ): bool {
        $notification = $this->loadModel(
            $user,
            $args['input'],
            Notification::class,
            $notification,
        );

        if (! $notification) {
            return false;
        }

        $accessThroughPulse = $this->hasAccessThroughPulse(
            $user,
            $notification,
            null,
        );
        $accessThroughOrganization = $this->hasAccessThroughOrganization(
            $user,
            $notification,
            null,
        );

        // Grant access if the user is linked via either pulses or organizations
        return ($accessThroughPulse || $accessThroughOrganization) && $user->hasPermission('update:notifications');
    }

    /**
     * Check if the user has access through pulse.
     */

    private function hasAccessThroughPulse(
        User $user,
        Notification $notification = null,
        $pulseId = null,
    ): bool {
        if ($pulseId) {
            $pulse = Pulse::find($pulseId);

            return $pulse && $pulse
                    ->members()
                    ->where('user_id', $user->id)
                    ->exists();
        }

        if ($notification) {
            return $notification
                ->pulse()
                ->whereHas('members', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->exists();
        }

        return false;
    }

    /**
     * Check if the user has access through organization.
     */
    private function hasAccessThroughOrganization(
        User $user,
        Notification $notification = null,
        $organizationId = null,
    ): bool {
        if ($organizationId) {
            $organization = Organization::find($organizationId);
            return $organization && $organization
                    ->users()
                    ->where('user_id', $user->id)
                    ->exists();
        }

        if ($notification) {
            return $notification
                ->organization()
                ->whereHas('users', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->exists();
        }
        return false;
    }
}
