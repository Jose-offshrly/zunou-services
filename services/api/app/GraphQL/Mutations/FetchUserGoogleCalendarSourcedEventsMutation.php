<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Jobs\GoogleCalendarEventDeltaSyncJob;
use App\Services\GoogleCalendarService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class FetchUserGoogleCalendarSourcedEventsMutation
{
    public function __invoke($_, array $args = []): array
    {
        $user = Auth::user();

        // Check if user has a Google Calendar refresh token
        if (! $user->google_calendar_refresh_token) {
            throw new Error('Google Calendar is not connected. Please reconnect your Google Calendar.');
        }

        // Validate that the refresh token is still valid
        try {
            $calendarService = new GoogleCalendarService(
                $user->google_calendar_refresh_token,
            );

            if (! $calendarService->validateRefreshToken()) {
                throw new Error(
                    'Google Calendar refresh token has expired. Please reconnect your Google Calendar.',
                );
            }
        } catch (Error $e) {
            // Re-throw GraphQL errors as-is
            throw $e;
        } catch (\Exception $e) {
            // If service initialization fails, the refresh token is likely invalid/expired
            throw new Error(
                'Google Calendar refresh token is invalid or expired. Please reconnect your Google Calendar.',
            );
        }

        dispatch(
            new GoogleCalendarEventDeltaSyncJob(
                user: $user,
                args: $args,
            ),
        );
        Log::info('Using the new delta sync job');

        return [
            'success' => true,
            'message' => 'Sourced events sync job running',
        ];
    }
}
