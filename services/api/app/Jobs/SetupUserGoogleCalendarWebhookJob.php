<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Calendar\GoogleCalendarService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class SetupUserGoogleCalendarWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use Queueable;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = [60, 300, 900]; // 1 minute, 5 minutes, 15 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly User $user,
        public readonly bool $force = false,
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
            Log::error('User not found when setting up Google Calendar webhook', [
                'user_id' => $this->user->id,
            ]);

            return;
        }

        // Validate user has Google Calendar linked
        if (! $user->google_calendar_refresh_token || ! $user->google_calendar_linked) {
            Log::warning('Cannot setup webhook - user does not have Google Calendar linked', [
                'user_id'           => $user->id,
                'has_refresh_token' => ! empty($user->google_calendar_refresh_token),
                'is_linked'         => $user->google_calendar_linked,
            ]);

            return;
        }

        $webhookBaseUrl = config('google-calendar.webhook_base_url');

        if (! $webhookBaseUrl) {
            Log::error('Cannot setup webhook - GOOGLE_CALENDAR_WEBHOOK_BASE_URL is not set', [
                'user_id' => $user->id,
            ]);

            // Don't retry if config is missing - this is a configuration issue
            return;
        }

        try {
            // Refresh user again to get latest state before checking webhook validity
            $user->refresh();

            // Check if webhook already exists and is still valid
            $hasValidWebhook = ! $this->force
                && $user->google_calendar_channel_id
                && $user->google_calendar_resource_id
                && $user->google_calendar_channel_expires_at
                && $user->google_calendar_channel_expires_at->isFuture();

            if ($hasValidWebhook) {
                Log::info('Skipping webhook setup - webhook already exists and is valid', [
                    'user_id'    => $user->id,
                    'channel_id' => $user->google_calendar_channel_id,
                    'expires_at' => $user->google_calendar_channel_expires_at,
                ]);

                return;
            }

            // Store old webhook data before clearing
            $oldChannelId  = $user->google_calendar_channel_id;
            $oldResourceId = $user->google_calendar_resource_id;

            // Clear old webhook data from database BEFORE creating new one
            // This ensures we don't have stale data if creation fails
            $user->google_calendar_channel_id         = null;
            $user->google_calendar_resource_id       = null;
            $user->google_calendar_channel_expires_at = null;
            $user->save();

            // Stop existing webhook if it exists (using stored values)
            if ($oldChannelId && $oldResourceId) {
                try {
                    $calendarService = new GoogleCalendarService($user);
                    $calendarService->stopWatch($oldResourceId, $oldChannelId);
                    Log::info('Stopped existing webhook for user', [
                        'user_id'    => $user->id,
                        'channel_id' => $oldChannelId,
                    ]);
                } catch (\Exception $e) {
                    // Log but continue - webhook may have already expired
                    Log::warning('Failed to stop existing webhook for user', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);
                }
            }

            // Refresh user to ensure we have latest refresh token
            $user->refresh();

            // Create new webhook - use single endpoint with user ID as token
            $webhookUrl = rtrim($webhookBaseUrl, '/').'/api/google-calendar/webhook';

            Log::info('Setting up webhook for user', [
                'user_id'     => $user->id,
                'user_email'  => $user->email,
                'webhook_url' => $webhookUrl,
            ]);

            $calendarService = new GoogleCalendarService($user);

            // Create watch channel (TTL is 604800 seconds = 7 days)
            // Pass user ID as token so it's included in X-Goog-Channel-Token header
            $channel = $calendarService->createWatch($webhookUrl, 604800, 'primary', (string) $user->id);

            if (! $channel) {
                Log::error('Failed to create webhook for user', [
                    'user_id'     => $user->id,
                    'webhook_url' => $webhookUrl,
                ]);

                // Throw exception to trigger retry
                throw new \Exception('Failed to create Google Calendar watch channel');
            }

            // Store channel information atomically
            $user->google_calendar_channel_id         = $channel['id'];
            $user->google_calendar_resource_id        = $channel['resourceId'];
            $user->google_calendar_channel_expires_at = Carbon::createFromTimestampMs($channel['expiration']);
            $user->save();

            Log::info('Successfully set up webhook for user', [
                'user_id'     => $user->id,
                'channel_id'  => $channel['id'],
                'resource_id' => $channel['resourceId'],
                'expires_at'  => $user->google_calendar_channel_expires_at,
            ]);
        } catch (\Exception $e) {
            Log::error('Error setting up Google Calendar webhook for user', [
                'user_id'      => $user->id ?? null,
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
                'attempt'      => $this->attempts(),
                'max_attempts' => $this->tries,
            ]);

            // Re-throw to trigger queue retry mechanism
            throw $e;
        }
    }
}
