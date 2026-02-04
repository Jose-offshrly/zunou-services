<?php

namespace App\Actions\GoogleCalendar;

use App\DataTransferObjects\GoogleWebhookNotificationData;
use App\Jobs\GoogleCalendarDeltaSyncOrchestratorJob;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class HandleGoogleCalendarWebhookAction
{
    public function handle(User $user, GoogleWebhookNotificationData $notification): array
    {
        Log::info('Processing Google Calendar webhook', [
            'user_id'        => $user->id,
            'resource_state' => $notification->resourceState,
        ]);

        $organizationIds = $user->organizationIds();

        // Dispatch orchestrator job that fetches events once, then dispatches
        // parallel jobs per organization. Sync token is updated only after
        // all org jobs complete.
        dispatch(
            new GoogleCalendarDeltaSyncOrchestratorJob(
                user: $user,
                organizationIds: $organizationIds,
            ),
        );

        return [
            'message'        => 'Webhook processed',
            'resource_state' => $notification->resourceState,
        ];
    }
}
