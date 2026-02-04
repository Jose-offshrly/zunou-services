<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CheckAndSetupGoogleCalendarWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly User $user,
    ) {
        $this->onQueue('high');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Refresh user from database to ensure we have the latest data
        $user = User::find($this->user->id);

        if (! $user) {
            Log::warning('User not found when checking Google Calendar webhook', [
                'user_id' => $this->user->id,
            ]);

            return;
        }

        // Check if webhook setup is needed
        if (! $this->shouldSetupWebhook($user)) {
            return;
        }

        // Dispatch the setup job
        Log::info('Dispatching webhook setup job for user', [
            'user_id' => $user->id,
        ]);

        SetupUserGoogleCalendarWebhookJob::dispatch($user);
    }

    /**
     * Check if webhook setup is needed for the user.
     * Returns true if:
     * - User has Google Calendar linked AND
     * - (Webhook doesn't exist OR webhook is expired)
     *
     * @param  User  $user
     * @return bool
     */
    private function shouldSetupWebhook(User $user): bool
    {
        // Check if user has Google Calendar linked
        if (! $user->google_calendar_linked || ! $user->google_calendar_refresh_token) {
            Log::debug('Skipping webhook setup - user does not have Google Calendar linked', [
                'user_id'           => $user->id,
                'has_refresh_token' => ! empty($user->google_calendar_refresh_token),
                'is_linked'         => $user->google_calendar_linked,
            ]);

            return false;
        }

        // Check if webhook exists and is still valid (not expired)
        $hasValidWebhook = $user->google_calendar_channel_id
            && $user->google_calendar_resource_id
            && $user->google_calendar_channel_expires_at
            && $user->google_calendar_channel_expires_at->isFuture();

        if ($hasValidWebhook) {
            // Verify the connection is actually working
            try {
                $calendarService = new GoogleCalendarService($user->google_calendar_refresh_token);
                $isConnectionWorking = $calendarService->verifyConnection();

                if ($isConnectionWorking) {
                    Log::debug('Skipping webhook setup - webhook already exists, is valid, and connection is working', [
                        'user_id'    => $user->id,
                        'channel_id' => $user->google_calendar_channel_id,
                        'expires_at' => $user->google_calendar_channel_expires_at,
                    ]);

                    return false;
                }

                // Connection verification failed - webhook may not be working
                Log::info('Webhook exists but connection verification failed - setup needed', [
                    'user_id'    => $user->id,
                    'channel_id' => $user->google_calendar_channel_id,
                    'expires_at' => $user->google_calendar_channel_expires_at,
                ]);
            } catch (\Exception $e) {
                // If verification throws an exception, assume connection is broken
                Log::warning('Exception during connection verification - setup needed', [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                ]);
            }
        }

        // Webhook is missing or expired - setup needed
        Log::info('Webhook setup needed for user', [
            'user_id'        => $user->id,
            'has_channel_id' => ! empty($user->google_calendar_channel_id),
            'has_resource_id' => ! empty($user->google_calendar_resource_id),
            'expires_at'     => $user->google_calendar_channel_expires_at?->toIso8601String(),
            'is_expired'     => $user->google_calendar_channel_expires_at?->isPast(),
        ]);

        return true;
    }
}

