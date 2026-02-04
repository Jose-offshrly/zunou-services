<?php

namespace App\Console\Commands;

use App\Jobs\SetupUserGoogleCalendarWebhookJob;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SetupGoogleCalendarWebhooks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'google:setup-webhooks {--force : Force recreation of existing webhooks}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up Google Calendar webhooks for all users with refresh tokens';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $webhookBaseUrl = config('google-calendar.webhook_base_url');

        if (! $webhookBaseUrl) {
            $this->error('GOOGLE_CALENDAR_WEBHOOK_BASE_URL is not set in environment variables.');
            return 1;
        }

        // Get all users with Google Calendar refresh tokens
        $users = User::whereNotNull('google_calendar_refresh_token')
            ->where('google_calendar_linked', true)
            ->get();

        $this->info("Found {$users->count()} users with Google Calendar linked.");

        $successCount = 0;
        $errorCount   = 0;
        $skippedCount = 0;

        foreach ($users as $user) {
            try {

                SetupUserGoogleCalendarWebhookJob::dispatch($user, false);

            } catch (\Exception $e) {
                $this->error("✗ Error setting up webhook for user {$user->id}: {$e->getMessage()}");
                $errorCount++;
                Log::error("Error setting up Google Calendar webhook for user {$user->id}", [
                    'user_id' => $user->id,
                    'error'   => $e->getMessage(),
                    'trace'   => $e->getTraceAsString(),
                ]);
            }
        }

        $this->newLine();
        $this->info('Summary:');
        $this->info("  Success: {$successCount}");
        $this->info("  Skipped: {$skippedCount}");
        $this->info("  Errors: {$errorCount}");

        return 0;
    }
}
