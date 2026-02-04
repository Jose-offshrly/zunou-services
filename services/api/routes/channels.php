<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('users.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});

Broadcast::channel('thread.{id}', function ($user, $id) {
    return true;
});

Broadcast::channel('team.thread.{threadId}', function ($user, $threadId) {
    return ['id' => $user->id, 'name' => $user->name];
});

Broadcast::channel('direct.thread.{threadId}', function ($user, $threadId) {
    $thread = App\Models\DirectMessageThread::find($threadId);
    if (!$thread) {
        return false;
    }

    return in_array($user->id, $thread->participants)
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});

Broadcast::channel('users.presence', function ($user) {
    return [
        'userId' => $user->id,
        'presence' => $user->presence,
        'name' => $user->name,
    ];
});

Broadcast::channel(
    'scout-reminders.{userId}.{organizationId}.{pulseId}',
    function ($user, $userId, $organizationId, $pulseId) {
        // Check if the user is authorized to receive scout reminder updates
        // User must be the same as the userId parameter and be a member of the organization/pulse
        if ($user->id !== $userId) {
            return false;
        }

        // Check if user belongs to the organization
        $organizationUser = App\Models\OrganizationUser::where(
            'user_id',
            $userId
        )
            ->where('organization_id', $organizationId)
            ->first();

        if (!$organizationUser) {
            return false;
        }

        // Check if user has access to the pulse
        $pulseMember = App\Models\PulseMember::where('user_id', $userId)
            ->where('pulse_id', $pulseId)
            ->first();

        return $pulseMember ? true : false;
    }
);

Broadcast::channel('organization-notification.{organizationId}', function (
    $user,
    $organizationId
) {
    // Check if user belongs to the organization
    $organizationUser = App\Models\OrganizationUser::where('user_id', $user->id)
        ->where('organization_id', $organizationId)
        ->first();

    return $organizationUser
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});

Broadcast::channel('team-messages.{organizationId}', function (
    $user,
    $organizationId
) {
    // Check if user belongs to the organization
    $organizationUser = App\Models\OrganizationUser::where('user_id', $user->id)
        ->where('organization_id', $organizationId)
        ->first();

    return $organizationUser
        ? ['id' => $user->id, 'name' => $user->name]
        : false;
});
