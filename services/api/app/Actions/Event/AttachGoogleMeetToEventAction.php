<?php

declare(strict_types=1);

namespace App\Actions\Event;

use App\Concerns\CalendarEventHandler;
use App\DataTransferObjects\ScheduledEventData;
use App\Models\Event;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AttachGoogleMeetToEventAction
{
    use CalendarEventHandler;

    public function handle(Event $event, ?bool $invite_pulse = false): Event
    {
        // Check if event already has a link
        if (! empty($event->link)) {
            Log::info(
                'Event already has a link, skipping Google Meet attachment',
                [
                    'event_id'      => $event->id,
                    'existing_link' => $event->link,
                ],
            );

            return $event;
        }

        /** @var User $user */
        $user = Auth::user();
        if (! $user) {
            throw new \RuntimeException('User not authenticated');
        }

        // Check if user has Google Calendar tokens
        if (
            ! $user->google_calendar_access_token || ! $user->google_calendar_refresh_token
        ) {
            throw new \RuntimeException(
                'User has not properly authorized Google Calendar access',
            );
        }

        // Check if event has a google_event_id (was created from Google Calendar)
        if (! $event->google_event_id) {
            // If no google_event_id, create a new calendar event with Meet link
            // Note: This will make the current user the organizer of the new calendar event
            Log::info(
                'Event has no Google Calendar ID, creating new calendar event with Meet link',
                [
                    'event_id'     => $event->id,
                    'event_owner'  => $event->user_id,
                    'current_user' => $user->id,
                ],
            );

            return $this->createNewCalendarEventWithMeet(
                event: $event,
                user: $user,
                invite_pulse: $invite_pulse,
            );
        }

        // If it has google_event_id, update the existing Google Calendar event
        // Note: This requires the current user to be the organizer of the Google Calendar event
        Log::info(
            'Event has Google Calendar ID, attempting to update existing event with Meet link',
            [
                'event_id'        => $event->id,
                'google_event_id' => $event->google_event_id,
            ],
        );

        return $this->updateExistingCalendarEvent($event, $user);
    }

    private function createNewCalendarEventWithMeet(
        Event $event,
        User $user,
        bool $invite_pulse,
    ): Event {
        try {
            Log::info('Creating new Google Calendar event with Meet link', [
                'event_id'   => $event->id,
                'event_name' => $event->name,
            ]);

            // Create ScheduledEventData for the calendar event creation
            // Access raw UTC values from database and convert to user timezone for Google Calendar
            $eventData = new ScheduledEventData(
                name: $event->name,
                date: $event->date instanceof \Carbon\Carbon
                    ? $event->date->toDateString()
                    : $event->date,
                start_at: Carbon::parse(
                    $event->start_at,
                    $user->timezone,
                )->timezone('UTC'),
                end_at: Carbon::parse(
                    $event->end_at,
                    $user->timezone,
                )->timezone('UTC'),
                pulse_id: $event->pulse_id,
                organization_id: $event->organization_id,
                user_id: $event->user_id,
                create_event: true, // This will trigger calendar event creation
                location: $event->location,
                summary: $event->summary,
                attendees: $event->guests ?? [],
                invite_pulse: $invite_pulse, // Always include video conferencing when attaching Meet
            );

            Log::info('LOCAL EVENT:', $eventData->all());

            // Use the CalendarEventHandler trait to create the event and get the Meet link
            $googleEvent = $this->createCalendarEvent($eventData, $user);
            Log::info('GOOGLE EVENT');
            $meetLink = $googleEvent['link'];

            // Update the event with the Meet link and Google event ID
            $event->update([
                'link'            => $meetLink,
                'google_event_id' => $googleEvent['google_event_id'],
            ]);

            Log::info(
                'Successfully created new Google Calendar event with Meet link',
                [
                    'event_id'  => $event->id,
                    'meet_link' => $meetLink,
                ],
            );

            return $event->fresh();
        } catch (\Exception $e) {
            Log::error(
                'Failed to create new Google Calendar event with Meet link',
                [
                    'event_id' => $event->id,
                    'error'    => $e->getMessage(),
                ],
            );
            throw $e;
        }
    }

    private function updateExistingCalendarEvent(
        Event $event,
        User $user,
    ): Event {
        try {
            Log::info(
                'Updating existing Google Calendar event with Meet link',
                [
                    'event_id'        => $event->id,
                    'google_event_id' => $event->google_event_id,
                ],
            );

            $googleCalendarService = new GoogleCalendarService(
                $user->google_calendar_refresh_token,
            );

            // Validate and refresh token if needed
            if (! $googleCalendarService->validateRefreshToken()) {
                throw new \RuntimeException(
                    'Google Calendar refresh token is invalid or expired. Please re-authorize Google Calendar access.',
                );
            }

            if ($googleCalendarService->isAccessTokenExpired()) {
                $newToken                           = $googleCalendarService->refreshAccessToken();
                $user->google_calendar_access_token = $newToken['access_token'];
                $user->save();
                $googleCalendarService = new GoogleCalendarService(
                    $user->google_calendar_refresh_token,
                );
            }

            // Update the Google Calendar event to add Meet link
            $meetLink = $googleCalendarService->addMeetLinkToEvent(
                $event->google_event_id,
                $user,
            );

            if (! $meetLink) {
                throw new \RuntimeException(
                    'Failed to add Google Meet link to existing calendar event',
                );
            }

            // Update the event with the Meet link
            $event->update(['link' => $meetLink]);

            Log::info(
                'Successfully updated existing Google Calendar event with Meet link',
                [
                    'event_id'        => $event->id,
                    'google_event_id' => $event->google_event_id,
                    'meet_link'       => $meetLink,
                ],
            );

            return $event->fresh();
        } catch (\Exception $e) {
            Log::error(
                'Failed to update existing Google Calendar event with Meet link',
                [
                    'event_id'        => $event->id,
                    'google_event_id' => $event->google_event_id,
                    'error'           => $e->getMessage(),
                ],
            );

            // Check if this is an organizer permission issue - pass through as-is
            if (
                str_contains(
                    $e->getMessage(),
                    'Only the event organizer can add Google Meet links',
                )
            ) {
                throw new \RuntimeException($e->getMessage());
            }

            // Check if this is already a "Failed to add" error to avoid double-wrapping
            if (
                str_contains(
                    $e->getMessage(),
                    'Failed to add Google Meet link',
                )
            ) {
                throw new \RuntimeException($e->getMessage());
            }

            throw new \RuntimeException(
                'Failed to add Google Meet link: ' . $e->getMessage(),
            );
        }
    }
}
