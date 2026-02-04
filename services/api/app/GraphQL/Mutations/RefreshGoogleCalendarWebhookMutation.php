<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Jobs\SetupUserGoogleCalendarWebhookJob;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class RefreshGoogleCalendarWebhookMutation
{
    public function __invoke($_, array $args): array
    {
        try {
            $user = Auth::user();
            if (! $user) {
                Log::error(
                    'User not authenticated when refreshing Google Calendar webhook',
                );
                throw new Error('User not authenticated');
            }

            Log::info('Refreshing Google Calendar webhook for user', [
                'user_id'    => $user->id,
                'user_email' => $user->email,
            ]);

            // Construct the webhook URL (same as in SetupUserGoogleCalendarWebhookJob)
            $webhookBaseUrl = config('google-calendar.webhook_base_url');
            $webhookUrl     = $webhookBaseUrl
                ? rtrim($webhookBaseUrl, '/').'/api/google-calendar/webhook'
                : null;

            // Dispatch the job with force = true to recreate the webhook
            SetupUserGoogleCalendarWebhookJob::dispatch($user, true);

            return [
                'success'     => true,
                'message'     => 'Google Calendar webhook refresh has been queued',
                'webhook_url' => $webhookUrl,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to refresh Google Calendar webhook', [
                'user_id' => $user->id ?? null,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            throw new Error('Failed to refresh Google Calendar webhook: '.$e->getMessage());
        }
    }
}
