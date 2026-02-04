<?php

namespace App\Concerns;

use App\DataTransferObjects\MeetingSession\MeetingSessionData;
use App\DataTransferObjects\ScheduledEventData;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait CalendarEventHandler
{
    private function createCalendarEvent(
        ScheduledEventData|MeetingSessionData $data,
        ?User $user = null,
    ): array {
        $user = $user ?? Auth::user();

        if (
            ! $user->google_calendar_access_token || ! $user->google_calendar_refresh_token
        ) {
            throw new \RuntimeException(
                'User has not properly authorized Google Calendar access',
            );
        }

        try {
            $googleCalendarService = new GoogleCalendarService(
                $user->google_calendar_refresh_token,
            );

            // Validate the refresh token first
            if (! $googleCalendarService->validateRefreshToken()) {
                Log::error('Invalid refresh token for user', [
                    'user_id' => $user->id,
                ]);

                throw new \RuntimeException(
                    'Google Calendar refresh token is invalid or expired. Please re-authorize Google Calendar access.',
                );
            }

            // Check if the access token is expired and refresh if needed
            if ($googleCalendarService->isAccessTokenExpired()) {
                Log::info('Access token expired for user, refreshing...', [
                    'user_id' => $user->id,
                ]);

                try {
                    $newToken = $googleCalendarService->refreshAccessToken();

                    // Update the user's access token in the database
                    $user->google_calendar_access_token = $newToken['access_token'];
                    $user->save();

                    Log::info('Successfully refreshed access token for user', [
                        'user_id' => $user->id,
                    ]);

                    // Re-instantiate the GoogleCalendarService with the new access token
                    $googleCalendarService = new GoogleCalendarService(
                        $user->google_calendar_refresh_token,
                    );
                } catch (\Exception $refreshError) {
                    Log::error('Failed to refresh access token for user', [
                        'user_id' => $user->id,
                        'error'   => $refreshError->getMessage(),
                    ]);

                    throw new \RuntimeException(
                        'Failed to refresh Google Calendar access token. Please re-authorize Google Calendar access.',
                        0,
                        $refreshError,
                    );
                }
            }

            // Determine if video conferencing should be included based on invite_pulse
            $includeVideoConferencing = true;
            if ($data instanceof ScheduledEventData) {
                $includeVideoConferencing = $data->invite_pulse;
            }

            $eventData = [
                'summary'     => $data->name,
                'description' => $this->normalizeDescription(
                    $data->description ?? null,
                ),
                'start'                      => $data->start_at,
                'end'                        => $data->end_at,
                'timeZone'                   => $user->timezone,
                'include_video_conferencing' => $includeVideoConferencing,
                // Ensure the creator is included as an accepted attendee
                'attendees' => (function () use ($data, $user) {
                    $attendees = is_array($data->attendees)
                        ? $data->attendees
                        : [];

                    $creatorEmail = $user->email ?? null;

                    // Helper to extract and normalize email from attendee
                    $normalizeToEmail = function ($attendee): ?string {
                        if (is_string($attendee)) {
                            return strtolower(trim($attendee));
                        }

                        if (is_array($attendee)) {
                            $email = $attendee['email'] ?? ($attendee['name'] ?? null);
                            return $email
                                ? strtolower(trim((string) $email))
                                : null;
                        }

                        return null;
                    };

                    // Helper to validate email format
                    $isValidEmail = function (?string $email): bool {
                        if (! $email || $email === '') {
                            return false;
                        }
                        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
                    };

                    // Filter and validate attendees
                    $validAttendees = [];
                    $existingEmails = [];
                    $invalidEmails  = [];

                    foreach ($attendees as $attendee) {
                        $email = $normalizeToEmail($attendee);

                        if (! $isValidEmail($email)) {
                            $invalidEmails[] = $email ?? 'null';
                            continue;
                        }

                        // Skip duplicates
                        if (isset($existingEmails[$email])) {
                            continue;
                        }

                        $existingEmails[$email] = true;
                        $validAttendees[] = is_array($attendee)
                            ? $attendee
                            : ['email' => $email];
                    }

                    // Log invalid emails for debugging
                    if (! empty($invalidEmails)) {
                        Log::warning('Filtered out invalid attendee emails', [
                            'invalid_emails' => $invalidEmails,
                            'user_id'        => $user->id ?? null,
                        ]);
                    }

                    // Add creator as accepted attendee if valid and not already present
                    if ($creatorEmail && $isValidEmail($creatorEmail)) {
                        $creatorEmailNormalized = strtolower(trim($creatorEmail));
                        if (! isset($existingEmails[$creatorEmailNormalized])) {
                            $validAttendees[] = [
                                'email'          => $creatorEmail,
                                'responseStatus' => 'accepted',
                            ];
                        }
                    }

                    return $validAttendees;
                })(),
            ];

            $event = $googleCalendarService->createEvent(data: $eventData);
            if (! $event) {
                throw new \RuntimeException(
                    'Failed to create Google Calendar event. The API returned no event data.',
                );
            }

            // Handle the response based on whether video conferencing was requested
            if ($includeVideoConferencing) {
                if (! $event->hangoutLink) {
                    Log::warning(
                        'Google Calendar event created but no hangout link available',
                        [
                            'event_id' => $event->getId(),
                            'user_id'  => $user->id,
                        ],
                    );

                    throw new \RuntimeException(
                        'Google Calendar event created but Meet link is unavailable. Please ensure Google Meet is enabled.',
                    );
                }

                Log::info(
                    'Successfully created Google Calendar event with hangout link',
                    [
                        'event_id'     => $event->getId(),
                        'user_id'      => $user->id,
                        'hangout_link' => $event->hangoutLink,
                    ],
                );

                return [
                    'link'            => $event->hangoutLink,
                    'google_event_id' => $event->getId(),
                ];
            } else {
                Log::info(
                    'Successfully created Google Calendar event without video conferencing',
                    [
                        'event_id' => $event->getId(),
                        'user_id'  => $user->id,
                    ],
                );

                return [
                    'link'            => null,
                    'google_event_id' => $event->getId(),
                ];
            }
        } catch (\RuntimeException $e) {
            // Re-throw RuntimeExceptions (our custom errors)
            throw $e;
        } catch (\Exception $e) {
            Log::error('Unexpected error creating Google Calendar event', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            throw new \RuntimeException(
                'An unexpected error occurred while creating the Google Calendar event. Please try again.',
                0,
                $e,
            );
        }
    }

    private function normalizeDescription(?string $description): ?string
    {
        if ($description === null || $description === '') {
            return null;
        }

        return trim($description);
    }
}
