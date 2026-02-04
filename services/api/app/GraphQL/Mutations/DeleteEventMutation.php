<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Event;
use App\Models\User;
use App\Services\GoogleCalendarService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final readonly class DeleteEventMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $event = Event::find($args['id']);
            if (! $event) {
                throw new Error('Event not found!');
            }

            // Check if sync_with_google_calendar parameter is provided
            $syncWithGoogleCalendar = $args['sync_with_google_calendar'] ?? false;

            Log::info('Deleting event', [
                'event_id'                  => $event->id,
                'sync_with_google_calendar' => $syncWithGoogleCalendar,
                'google_event_id'           => $event->google_event_id,
            ]);

            // If sync is requested and event has a google_event_id, delete from Google Calendar first
            if ($syncWithGoogleCalendar && $event->google_event_id) {
                // Check if user has Google Calendar tokens
                if (
                    ! $user->google_calendar_access_token || ! $user->google_calendar_refresh_token
                ) {
                    Log::warning(
                        'Skipping Google Calendar sync - user has no Google Calendar tokens',
                        [
                            'event_id' => $event->id,
                            'user_id'  => $user->id,
                        ],
                    );
                } else {
                    try {
                        $googleCalendarService = new GoogleCalendarService(
                            $user->google_calendar_refresh_token,
                        );

                        Log::info(
                            'Attempting to delete event from Google Calendar',
                            [
                                'event_id'        => $event->id,
                                'google_event_id' => $event->google_event_id,
                            ],
                        );

                        $success = $googleCalendarService->deleteEvent(
                            $event->google_event_id,
                            $user,
                        );

                        if ($success) {
                            Log::info(
                                'Successfully deleted event from Google Calendar',
                                [
                                    'event_id'        => $event->id,
                                    'google_event_id' => $event->google_event_id,
                                ],
                            );
                        } else {
                            Log::warning(
                                'Failed to delete event from Google Calendar',
                                [
                                    'event_id'        => $event->id,
                                    'google_event_id' => $event->google_event_id,
                                ],
                            );
                        }
                    } catch (\Exception $syncError) {
                        // Log the error but don't fail the entire deletion
                        Log::error('Error during Google Calendar deletion', [
                            'event_id'        => $event->id,
                            'google_event_id' => $event->google_event_id,
                            'error'           => $syncError->getMessage(),
                            'trace'           => $syncError->getTraceAsString(),
                        ]);
                    }
                }
            }

            // Delete the event from the database
            $event->delete();

            Log::info('Successfully deleted event', [
                'event_id' => $event->id,
            ]);

            return $event;
        } catch (\Exception $e) {
            Log::error('Failed to delete event', [
                'event_id' => $args['id'] ?? null,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            throw new Error('Failed to delete event: ' . $e->getMessage());
        }
    }
}
