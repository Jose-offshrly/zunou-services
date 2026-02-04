<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Event;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SyncSingleEventMutation
{
    public function __construct(
        protected GoogleCalendarService $googleCalendarService,
    ) {
    }

    public function __invoke($_, array $args): array
    {
        try {
            /** @var User $user */
            $user = Auth::user();
            if (! $user) {
                throw new \Exception('User not authenticated');
            }

            $eventId = $args['eventId'] ?? null;
            if (! $eventId) {
                throw new \Exception('Event ID is required');
            }

            // Check if user has Google Calendar tokens
            if (
                ! $user->google_calendar_access_token || ! $user->google_calendar_refresh_token
            ) {
                throw new \Exception(
                    'Google Calendar not connected. Please link your calendar first.',
                );
            }

            // Find the local event by ID (this will be handled by @canModel directive)
            $event = Event::find($eventId);
            if (! $event) {
                throw new \Exception('Event not found');
            }

            // Check if the event has a google_event_id
            if (! $event->google_event_id) {
                throw new \Exception(
                    'This event is not linked to a Google Calendar event',
                );
            }

            $googleEventId = $event->google_event_id;

            Log::info('Starting single event sync from Google Calendar', [
                'user_id'         => $user->id,
                'event_id'        => $event->id,
                'google_event_id' => $googleEventId,
            ]);

            // Initialize Google Calendar service
            $this->googleCalendarService = new GoogleCalendarService(
                $user->google_calendar_refresh_token,
            );

            // Set the tokens on the Google client
            $this->googleCalendarService->setAccessToken([
                'access_token'  => $user->google_calendar_access_token,
                'refresh_token' => $user->google_calendar_refresh_token,
            ]);

            // If expired, auto-refresh the token
            if ($this->googleCalendarService->isAccessTokenExpired()) {
                Log::info('Access token expired. Refreshing...', [
                    'user_id' => $user->id,
                ]);

                $newToken                           = $this->googleCalendarService->refreshAccessToken();
                $user->google_calendar_access_token = $newToken['access_token'];
                $user->save();

                Log::info('Access token refreshed successfully', [
                    'user_id' => $user->id,
                ]);
            }

            // Fetch the event from Google Calendar
            $googleEvent = $this->googleCalendarService->getEventById(
                $googleEventId,
                $user,
            );
            if (! $googleEvent) {
                throw new \Exception(
                    'Event not found in Google Calendar or failed to fetch',
                );
            }

            Log::info('Successfully fetched event from Google Calendar', [
                'event_id'             => $event->id,
                'google_event_id'      => $googleEventId,
                'google_event_summary' => $googleEvent['summary'],
            ]);

            // Update the local event with Google Calendar data
            $eventStartTime = Carbon::parse(
                $googleEvent['start']['dateTime'],
                $user->timezone,
            )->timezone('UTC');
            $eventEndTime = Carbon::parse(
                $googleEvent['end']['dateTime'],
                $user->timezone,
            )->timezone('UTC');

            $updateData = [
                'name'        => $googleEvent['summary'],
                'description' => $googleEvent['description'],
                'location'    => $googleEvent['location'],
                'date'        => $eventStartTime,
                'start_at'    => $eventStartTime,
                'end_at'      => $eventEndTime,
            ];

            // Update the link if a Meet link is available
            if (! empty($googleEvent['link'])) {
                $updateData['link'] = $googleEvent['link'];
            }

            // Update the event
            $event->update($updateData);

            // Refresh the event to get the updated data
            $event->refresh();

            Log::info('Successfully synced event from Google Calendar', [
                'event_id'        => $event->id,
                'google_event_id' => $googleEventId,
                'updated_fields'  => array_keys($updateData),
            ]);

            return [
                'success' => true,
                'message' => 'Event successfully synced from Google Calendar',
                'event'   => $event,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to sync single event from Google Calendar', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to sync event: ' . $e->getMessage(),
                'event'   => null,
            ];
        }
    }
}
