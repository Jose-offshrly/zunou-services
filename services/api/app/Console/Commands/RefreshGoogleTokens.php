<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RefreshGoogleTokens extends Command
{
    protected $signature = 'google:refresh-tokens';

    protected $description = 'Refresh all users\' Google Calendar access tokens';

    public function handle()
    {
        $users = User::whereNotNull('google_calendar_refresh_token')->get();

        $this->info("Found {$users->count()} users with refresh tokens.");

        foreach ($users as $user) {
            try {
                $service = new GoogleCalendarService(
                    $user->google_calendar_refresh_token,
                );

                $newToken = $service->refreshAccessToken();

                if (! empty($newToken['access_token'])) {
                    $user->google_calendar_access_token = $newToken['access_token'];

                    // Optionally update refresh_token if Google returns a new one
                    if (! empty($newToken['refresh_token'])) {
                        $user->google_calendar_refresh_token = $newToken['refresh_token'];
                    }

                    $user->save();

                    $this->info("Refreshed token for user ID {$user->id}");
                } else {
                    $this->warn(
                        "Failed to get new token for user ID {$user->id}",
                    );
                }
            } catch (\Exception $e) {
                Log::error("Token refresh failed for user ID {$user->id}", [
                    'error' => $e->getMessage(),
                ]);
                $this->error(
                    "Error refreshing user ID {$user->id}: {$e->getMessage()}",
                );
            }
        }

        $this->info('Google token refresh completed.');
    }
}
