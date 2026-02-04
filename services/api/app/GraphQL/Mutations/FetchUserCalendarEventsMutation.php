<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Jobs\FetchUserGoogleCalendarEventsJob;
use App\Services\GoogleCalendarService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class FetchUserCalendarEventsMutation
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
            new FetchUserGoogleCalendarEventsJob(
                user: $user,
                args: $args,
            ),
        );

        return [
            'success' => true,
            'message' => 'Sync job running',
        ];
    }
}
