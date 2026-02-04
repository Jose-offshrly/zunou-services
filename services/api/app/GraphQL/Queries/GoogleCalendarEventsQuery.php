<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Pulse;
use App\Services\GoogleCalendarService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GoogleCalendarEventsQuery
{
    public function __construct(
        protected GoogleCalendarService $googleCalendarService,
    ) {
    }

    public function __invoke($_, array $args): array
    {
        try {
            $user = Auth::user();
            if (! $user) {
                Log::error(
                    'User not authenticated when fetching Google Calendar events',
                );
                throw new \Exception('User not authenticated');
            }

            $accessToken  = $user->google_calendar_access_token;
            $refreshToken = $user->google_calendar_refresh_token;

            if (! $accessToken || ! $refreshToken) {
                Log::error('Missing Google Calendar tokens', [
                    'user_id'           => $user->id,
                    'has_access_token'  => ! empty($accessToken),
                    'has_refresh_token' => ! empty($refreshToken),
                ]);
                throw new \Exception('Missing Google Calendar tokens');
            }

            Log::info('Initializing Google client with access token', [
                'user_id'             => $user->id,
                'access_token_prefix' => substr($accessToken, 0, 10) . '...',
            ]);

            // Set the tokens on the Google client
            $this->googleCalendarService->setAccessToken([
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
            ]);

            // If expired, auto-refresh the token
            if ($this->googleCalendarService->isAccessTokenExpired()) {
                Log::info('Access token expired. Refreshing...', [
                    'user_id' => $user->id,
                ]);

                $newToken = $this->googleCalendarService->refreshAccessToken();

                $user->google_calendar_access_token = $newToken['access_token'];
                $user->save();

                Log::info('Access token refreshed successfully', [
                    'user_id'          => $user->id,
                    'new_token_prefix' => substr($newToken['access_token'], 0, 10) . '...',
                ]);
            }

            // Get date filters from args
            $fromDate = null;
            $toDate   = null;

            if (isset($args['pulseId'])) {
                $pulse = Pulse::find($args['pulseId']);
                if (! $pulse) {
                    Log::error('Pulse not found for ID', [
                        'pulse_id' => $args['pulseId'],
                    ]);
                    throw new \Exception('Pulse not found');
                }
            } else {
                $pulse = null;
            }

            if (isset($args['onDate'])) {
                $fromDate = Carbon::parse($args['onDate'])->format('Y-m-d');
                $toDate   = $fromDate;
            } elseif (
                isset($args['dateRange']) && count($args['dateRange']) === 2
            ) {
                $fromDate = Carbon::parse($args['dateRange'][0])->format(
                    'Y-m-d',
                );
                $toDate = Carbon::parse($args['dateRange'][1])->format('Y-m-d');
            }

            $events = $this->googleCalendarService->getUpcomingEvents(
                fromDate: $fromDate,
                toDate: $toDate,
                pulse: $pulse,
            );

            return $events;
        } catch (\Exception $e) {
            Log::error('Failed to fetch Google Calendar events', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}
