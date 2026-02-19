<?php

namespace App\Services\Calendar;

use App\Contracts\CalendarInterface;
use App\DataTransferObjects\ScheduledEventData;
use App\DataTransferObjects\UpdateEventData;
use App\Events\GoogleCalendarTokenRevoked;
use App\Exceptions\GoogleCalendarTokenRevokedException;
use App\Models\User;
use Exception;
use Google\Client;
use Google\Service\Calendar;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService implements CalendarInterface
{
    protected Client $client;

    protected Calendar $service;

    public function __construct(protected User $user)
    {
        $credentials = $user->google_calendar_credentials;

        // Auto refresh before using; if the refresh token has been revoked or expired,
        // surface a clear, domain-specific exception so callers can prompt re-linking.
        try {
            TokenManager::refreshGoogleToken($user, $credentials);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'Token has been expired or revoked')) {

                $message = 'Google Calendar token has been expired or revoked. User must re-link Google Calendar.';
                broadcast(new GoogleCalendarTokenRevoked($this->user, $message));

                throw new GoogleCalendarTokenRevokedException(
                    $message,
                    0,
                    $e,
                );
            }

            throw $e;
        }

        $this->client = new Client();
        $this->client->setAccessToken($credentials['access_token']);
        $this->service = new Calendar($this->client);
    }

    /**
     * Get a list of calendar events.
     *
     * @param array{
     *     fromDate?: string       // e.g. "2025-01-01"
     *     toDate?: string       // e.g. "2025-01-31"
     *     timezone?: string       // e.g. "UTC"
     * } $params
     */
    public function getEvents(array $params = []): array
    {
        try {
            $service  = $this->service;
            $timezone = $params['timezone'] ?? 'UTC';

            // Set default time range if not provided
            $timeMin = isset($params['fromDate'])
                ? new \DateTime($params['fromDate'], new \DateTimeZone($timezone))
                : new \DateTime('now', new \DateTimeZone($timezone));
            $today = new \DateTime('now', new \DateTimeZone($timezone));
            $today->setTime(0, 0, 0);

            if (
                ! isset($params['fromDate']) || $timeMin->format('Y-m-d') === $today->format('Y-m-d')
            ) {
                // When no fromDate is provided or fromDate is today, use current time
                $timeMin = new \DateTime('now', new \DateTimeZone($timezone));
            } else {
                $timeMin->setTime(0, 0, 0);
            }

            $timeMax = isset($params['toDate'],
            ) ? new \DateTime($params['toDate'], new \DateTimeZone($timezone))
                : clone $timeMin;
            $timeMax->setTime(23, 59, 59);

            $optParams = [
                'maxResults'   => 100,
                'orderBy'      => 'startTime',
                'singleEvents' => true,
                'timeMin'      => $timeMin->format('c'),
                'timeMax'      => $timeMax->format('c'),
                'timeZone'     => $timezone,
            ];

            $results = $service->events->listEvents('primary', $optParams);
            $events  = $results->getItems();

            return array_map(function ($event) use ($timezone) {
                return [
                    'id'          => $event->getId(),
                    'summary'     => $event->getSummary() ?? 'Untitled Event',
                    'description' => $event->getDescription(),
                    'location'    => $event->getLocation(),
                    'start'       => [
                        'dateTime' => $event->getStart()->getDateTime()
                            ? (new \DateTime($event->getStart()->getDateTime()))
                                ->setTimezone(new \DateTimeZone($timezone))
                                ->format('Y-m-d H:i:s')
                            : ($event->getStart()->getDate()
                                ? (new \DateTime($event->getStart()->getDate()))
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->format('Y-m-d H:i:s')
                                : null),
                        'timeZone' => $event->getStart()->getTimeZone() ?? $timezone,
                    ],
                    'end' => [
                        'dateTime' => $event->getEnd()->getDateTime()
                            ? (new \DateTime($event->getEnd()->getDateTime()))
                                ->setTimezone(new \DateTimeZone($timezone))
                                ->format('Y-m-d H:i:s')
                            : ($event->getEnd()->getDate()
                                ? (new \DateTime($event->getEnd()->getDate()))
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->format('Y-m-d H:i:s')
                                : null),
                        'timeZone' => $event->getEnd()->getTimeZone() ?? $timezone,
                    ],
                    'attendees' => $event->getAttendees()
                        ? array_map(
                            fn ($attendee) => [
                                'email'          => $attendee->getEmail(),
                                'displayName'    => $attendee->getDisplayName(),
                                'responseStatus' => $attendee->getResponseStatus(),
                            ],
                            $event->getAttendees(),
                        )
                        : [],
                    'conferenceData' => $event->getConferenceData()
                        ? [
                            'entryPoints' => array_map(
                                fn ($entryPoint) => [
                                    'entryPointType' => $entryPoint->getEntryPointType(),
                                    'uri'            => $entryPoint->getUri(),
                                ],
                                $event->getConferenceData()->getEntryPoints(),
                            ),
                        ]
                        : null,
                    'recurring_meeting_id' => $event->getRecurringEventId(),
                ];
            }, $events);
        } catch (Exception $e) {
            Log::error('Failed to fetch upcoming events from Google Calendar', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Get all event IDs from Google Calendar within a time window.
     * Used for bulk reconciliation to avoid fetching events one by one.
     * Returns a map of google_event_id => status for fast lookup.
     *
     * @return array<string, string> Map of event ID to status (confirmed, cancelled, etc.)
     */
    public function getAllEventIdsInWindow(
        \DateTimeInterface $windowStart,
        \DateTimeInterface $windowEnd,
        string $timezone = 'UTC',
    ): array {
        $eventMap = [];

        try {
            $pageToken = null;
            $pageCount = 0;
            $maxPages  = 50; // Safety limit to prevent infinite loops

            do {
                $pageCount++;

                $optParams = [
                    'maxResults'   => 2500, // Max allowed by Google API
                    'singleEvents' => true, // Expand recurring events
                    'timeMin'      => $windowStart->format('c'),
                    'timeMax'      => $windowEnd->format('c'),
                    'timeZone'     => $timezone,
                    'showDeleted'  => true, // Include cancelled events
                    'fields'       => 'items(id,status),nextPageToken', // Only fetch what we need
                ];

                if ($pageToken) {
                    $optParams['pageToken'] = $pageToken;
                }

                $results = $this->service->events->listEvents('primary', $optParams);
                $events  = $results->getItems();

                foreach ($events as $event) {
                    $eventMap[$event->getId()] = $event->getStatus();
                }

                $pageToken = $results->getNextPageToken();

                Log::debug('Fetched page of events for reconciliation', [
                    'page'         => $pageCount,
                    'events_count' => count($events),
                    'total_so_far' => count($eventMap),
                    'has_more'     => $pageToken !== null,
                ]);

            } while ($pageToken && $pageCount < $maxPages);

            Log::info('Completed bulk fetch of Google Calendar events', [
                'total_events'  => count($eventMap),
                'pages_fetched' => $pageCount,
            ]);

            return $eventMap;

        } catch (\Exception $e) {
            Log::error('Failed to bulk fetch events from Google Calendar', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Get a single event from Google Calendar by its ID
     */
    public function getEventById(string $eventId, ?string $timezone = 'UTC'): ?array
    {
        try {
            $event = $this->service->events->get('primary', $eventId);

            if (! $event) {
                Log::warning('Event not found in Google Calendar', [
                    'event_id' => $eventId,
                ]);

                return null;
            }

            // Extract Meet link from conference data
            $meetLink = null;
            if (
                $event->getConferenceData() && $event->getConferenceData()->getEntryPoints()
            ) {
                $entryPoints = $event->getConferenceData()->getEntryPoints();
                foreach ($entryPoints as $entryPoint) {
                    if (
                        $entryPoint->getEntryPointType() === 'video' && $entryPoint->getUri()
                    ) {
                        $meetLink = $entryPoint->getUri();
                        break;
                    }
                }
            }

            return [
                'id'          => $event->getId(),
                'status'      => $event->getStatus(),
                'summary'     => $event->getSummary() ?? 'Untitled Event',
                'description' => $event->getDescription(),
                'location'    => $event->getLocation(),
                'start'       => [
                    'dateTime' => $event->getStart()->getDateTime()
                        ? (new \DateTime($event->getStart()->getDateTime()))
                            ->setTimezone(new \DateTimeZone($timezone))
                            ->format('Y-m-d H:i:s')
                        : ($event->getStart()->getDate()
                            ? (new \DateTime($event->getStart()->getDate()))
                                ->setTimezone(new \DateTimeZone($timezone))
                                ->format('Y-m-d H:i:s')
                            : null),
                    'timeZone' => $event->getStart()->getTimeZone() ?? $timezone,
                ],
                'end' => [
                    'dateTime' => $event->getEnd()->getDateTime()
                        ? (new \DateTime($event->getEnd()->getDateTime()))
                            ->setTimezone(new \DateTimeZone($timezone))
                            ->format('Y-m-d H:i:s')
                        : ($event->getEnd()->getDate()
                            ? (new \DateTime($event->getEnd()->getDate()))
                                ->setTimezone(new \DateTimeZone($timezone))
                                ->format('Y-m-d H:i:s')
                            : null),
                    'timeZone' => $event->getEnd()->getTimeZone() ?? $timezone,
                ],
                'attendees' => $event->getAttendees()
                    ? array_map(
                        fn ($attendee) => [
                            'email'          => $attendee->getEmail(),
                            'displayName'    => $attendee->getDisplayName(),
                            'responseStatus' => $attendee->getResponseStatus(),
                        ],
                        $event->getAttendees(),
                    )
                    : [],
                'conferenceData' => $event->getConferenceData()
                    ? [
                        'entryPoints' => array_map(
                            fn ($entryPoint) => [
                                'entryPointType' => $entryPoint->getEntryPointType(),
                                'uri'            => $entryPoint->getUri(),
                            ],
                            $event->getConferenceData()->getEntryPoints(),
                        ),
                    ]
                    : null,
                'recurring_meeting_id' => $event->getRecurringEventId(),
                'link'                 => $meetLink,
            ];
        } catch (Exception $e) {
            Log::error('Failed to fetch event from Google Calendar', [
                'event_id' => $eventId,
                'error'    => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Get all instances of a recurring event within the current year.
     *
     * @param  string  $recurringEventId  The base recurring event ID (without timestamp suffix)
     * @param  string  $timezone          Timezone for the events
     * @return array   Array of event instances
     *
     * @deprecated Use getRecurringEventInstancesForWindow() for better performance
     */
    public function getRecurringEventInstancesForCurrentYear(
        string $recurringEventId,
        string $timezone = 'UTC',
    ): array {
        $currentYear = now()->year;
        $timeMin     = new \DateTime("{$currentYear}-01-01 00:00:00", new \DateTimeZone($timezone));
        $timeMax     = new \DateTime("{$currentYear}-12-31 23:59:59", new \DateTimeZone($timezone));

        return $this->fetchRecurringEventInstances(
            recurringEventId: $recurringEventId,
            timeMin: $timeMin,
            timeMax: $timeMax,
            timezone: $timezone,
            maxResults: 365,
        );
    }

    /**
     * Get instances of a recurring event within a sliding time window.
     * This is more performant than fetching the entire year.
     *
     * @param  string  $recurringEventId  The base recurring event ID (without timestamp suffix)
     * @param  string  $timezone          Timezone for the events
     * @param  int     $weeksPast         Number of weeks in the past to include (default: 2)
     * @param  int     $weeksFuture       Number of weeks in the future to include (default: 4)
     * @return array   Array of event instances
     */
    public function getRecurringEventInstancesForWindow(
        string $recurringEventId,
        string $timezone = 'UTC',
        int $weeksPast = 2,
        int $weeksFuture = 4,
    ): array {
        $timeMin = now($timezone)->subWeeks($weeksPast)->startOfDay();
        $timeMax = now($timezone)->addWeeks($weeksFuture)->endOfDay();

        // Calculate max results based on window size (assume max 1 event per day)
        $totalDays  = $timeMin->diffInDays($timeMax) + 1;
        $maxResults = min($totalDays, 100);

        return $this->fetchRecurringEventInstances(
            recurringEventId: $recurringEventId,
            timeMin: $timeMin->toDateTime(),
            timeMax: $timeMax->toDateTime(),
            timezone: $timezone,
            maxResults: $maxResults,
        );
    }

    /**
     * Internal method to fetch recurring event instances with given parameters.
     *
     * @param  string     $recurringEventId  The base recurring event ID
     * @param  \DateTime  $timeMin           Start of the time range
     * @param  \DateTime  $timeMax           End of the time range
     * @param  string     $timezone          Timezone for the events
     * @param  int        $maxResults        Maximum number of results to return
     * @return array      Array of event instances
     */
    private function fetchRecurringEventInstances(
        string $recurringEventId,
        \DateTime $timeMin,
        \DateTime $timeMax,
        string $timezone,
        int $maxResults,
    ): array {
        try {
            $optParams = [
                'timeMin'    => $timeMin->format('c'),
                'timeMax'    => $timeMax->format('c'),
                'timeZone'   => $timezone,
                'maxResults' => $maxResults,
            ];

            Log::info('Fetching recurring event instances', [
                'recurring_event_id' => $recurringEventId,
                'time_min'           => $timeMin->format('c'),
                'time_max'           => $timeMax->format('c'),
                'max_results'        => $maxResults,
            ]);

            $results   = $this->service->events->instances('primary', $recurringEventId, $optParams);
            $instances = $results->getItems();

            Log::info('Found recurring event instances', [
                'recurring_event_id' => $recurringEventId,
                'instance_count'     => count($instances),
            ]);

            return array_map(function ($event) use ($timezone) {
                $meetLink = null;
                if ($event->getConferenceData() && $event->getConferenceData()->getEntryPoints()) {
                    foreach ($event->getConferenceData()->getEntryPoints() as $entryPoint) {
                        if ($entryPoint->getEntryPointType() === 'video' && $entryPoint->getUri()) {
                            $meetLink = $entryPoint->getUri();

                            break;
                        }
                    }
                }

                $originalStartTime = $event->getOriginalStartTime();

                return [
                    'id'          => $event->getId(),
                    'status'      => $event->getStatus(),
                    'summary'     => $event->getSummary() ?? 'Untitled Event',
                    'description' => $event->getDescription(),
                    'location'    => $event->getLocation(),
                    'start'       => [
                        'dateTime' => $event->getStart()->getDateTime()
                            ? (new \DateTime($event->getStart()->getDateTime()))
                                ->setTimezone(new \DateTimeZone($timezone))
                                ->format('Y-m-d H:i:s')
                            : ($event->getStart()->getDate()
                                ? (new \DateTime($event->getStart()->getDate()))
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->format('Y-m-d H:i:s')
                                : null),
                        'timeZone' => $event->getStart()->getTimeZone() ?? $timezone,
                    ],
                    'end' => [
                        'dateTime' => $event->getEnd()->getDateTime()
                            ? (new \DateTime($event->getEnd()->getDateTime()))
                                ->setTimezone(new \DateTimeZone($timezone))
                                ->format('Y-m-d H:i:s')
                            : ($event->getEnd()->getDate()
                                ? (new \DateTime($event->getEnd()->getDate()))
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->format('Y-m-d H:i:s')
                                : null),
                        'timeZone' => $event->getEnd()->getTimeZone() ?? $timezone,
                    ],
                    'attendees' => $event->getAttendees()
                        ? array_map(
                            fn ($attendee) => [
                                'email'          => $attendee->getEmail(),
                                'displayName'    => $attendee->getDisplayName(),
                                'responseStatus' => $attendee->getResponseStatus(),
                            ],
                            $event->getAttendees(),
                        )
                        : [],
                    'conferenceData' => $event->getConferenceData()
                        ? [
                            'entryPoints' => array_map(
                                fn ($entryPoint) => [
                                    'entryPointType' => $entryPoint->getEntryPointType(),
                                    'uri'            => $entryPoint->getUri(),
                                ],
                                $event->getConferenceData()->getEntryPoints(),
                            ),
                        ]
                        : null,
                    'recurring_meeting_id' => $event->getRecurringEventId(),
                    'originalStartTime'    => $originalStartTime ? [
                        'dateTime' => $originalStartTime->getDateTime() ?: $originalStartTime->getDate(),
                        'timeZone' => $originalStartTime->getTimeZone() ?? null,
                    ] : null,
                    'link' => $meetLink,
                ];
            }, $instances);
        } catch (Exception $e) {
            Log::error('Failed to fetch recurring event instances', [
                'recurring_event_id' => $recurringEventId,
                'error'              => $e->getMessage(),
            ]);

            return [];
        }
    }

    public function addMeetLinkToEvent(string $eventId, User $user): ?string
    {
        try {

            $service = $this->service;

            // First, get the existing event
            Log::info('Fetching existing Google Calendar event', [
                'event_id' => $eventId,
            ]);

            try {
                $existingEvent = $service->events->get('primary', $eventId);
            } catch (\Exception $getError) {
                Log::error('Failed to fetch event from Google Calendar', [
                    'event_id'   => $eventId,
                    'error'      => $getError->getMessage(),
                    'error_code' => $getError->getCode(),
                ]);

                return null;
            }

            if (! $existingEvent) {
                Log::error('Event not found in Google Calendar', [
                    'event_id' => $eventId,
                ]);

                return null;
            }

            // Get the current user's email for permission checking
            $currentUserEmail = $user->email;

            Log::info(
                'Event found, checking permissions and existing conference data',
                [
                    'event_id'            => $eventId,
                    'has_conference_data' => $existingEvent->getConferenceData() !== null,
                    'organizer_email'     => $existingEvent->getOrganizer()
                        ? $existingEvent->getOrganizer()->getEmail()
                        : null,
                    'current_user_email' => $currentUserEmail,
                    'is_organizer'       => $currentUserEmail && $existingEvent->getOrganizer() && $currentUserEmail === $existingEvent->getOrganizer()->getEmail(),
                ],
            );

            // Check if current user is the organizer
            if (
                $existingEvent->getOrganizer() && $currentUserEmail && $currentUserEmail !== $existingEvent->getOrganizer()->getEmail()
            ) {
                Log::error(
                    'User is not the organizer of this event, cannot add Meet link',
                    [
                        'event_id'        => $eventId,
                        'organizer_email' => $existingEvent
                            ->getOrganizer()
                            ->getEmail(),
                        'current_user_email' => $currentUserEmail,
                    ],
                );
                throw new \Exception(
                    'Only the event organizer can add Google Meet links to this event. The organizer is: ' .
                    $existingEvent->getOrganizer()->getEmail(),
                );
            }

            // Check if it already has conference data (Meet link)
            if (
                $existingEvent->getConferenceData() && $existingEvent->getConferenceData()->getEntryPoints()
            ) {
                $entryPoints = $existingEvent
                    ->getConferenceData()
                    ->getEntryPoints();
                foreach ($entryPoints as $entryPoint) {
                    if (
                        $entryPoint->getEntryPointType() === 'video' && $entryPoint->getUri()
                    ) {
                        Log::info('Event already has a Meet link', [
                            'event_id'  => $eventId,
                            'meet_link' => $entryPoint->getUri(),
                        ]);

                        return $entryPoint->getUri();
                    }
                }
            }

            Log::info('Creating conference data objects for Meet link');

            // Update the event to add conference data (Meet link)
            $conferenceData = new \Google\Service\Calendar\ConferenceData();
            $createRequest  = new \Google\Service\Calendar\CreateConferenceRequest();
            $requestId      = uniqid('meet_', true);
            $createRequest->setRequestId($requestId);

            $conferenceSolutionKey = new \Google\Service\Calendar\ConferenceSolutionKey();
            $conferenceSolutionKey->setType('hangoutsMeet');
            $createRequest->setConferenceSolutionKey($conferenceSolutionKey);

            $conferenceData->setCreateRequest($createRequest);
            $existingEvent->setConferenceData($conferenceData);

            $optParams = ['conferenceDataVersion' => 1, 'sendUpdates' => 'all'];

            Log::info(
                'Attempting to update Google Calendar event with Meet link',
                [
                    'event_id'   => $eventId,
                    'request_id' => $requestId,
                    'opt_params' => $optParams,
                ],
            );

            try {
                $updatedEvent = $service->events->update(
                    'primary',
                    $eventId,
                    $existingEvent,
                    $optParams,
                );
            } catch (\Exception $updateError) {
                Log::error('Google Calendar API update call failed', [
                    'event_id'   => $eventId,
                    'error'      => $updateError->getMessage(),
                    'error_code' => $updateError->getCode(),
                    'trace'      => $updateError->getTraceAsString(),
                ]);

                return null;
            }

            Log::info(
                'Google Calendar update call completed, checking response',
                [
                    'event_id'            => $eventId,
                    'has_hangout_link'    => ! empty($updatedEvent->hangoutLink),
                    'has_conference_data' => $updatedEvent->getConferenceData() !== null,
                ],
            );

            // Check multiple ways to get the Meet link
            $meetLink = null;

            // Method 1: Direct hangoutLink property
            if ($updatedEvent->hangoutLink) {
                $meetLink = $updatedEvent->hangoutLink;
                Log::info('Found Meet link via hangoutLink property', [
                    'event_id'  => $eventId,
                    'meet_link' => $meetLink,
                ]);
            }

            // Method 2: Check conference data entry points
            if (! $meetLink && $updatedEvent->getConferenceData()) {
                $conferenceData = $updatedEvent->getConferenceData();
                if ($conferenceData->getEntryPoints()) {
                    foreach ($conferenceData->getEntryPoints() as $entryPoint) {
                        if (
                            $entryPoint->getEntryPointType() === 'video' && $entryPoint->getUri()
                        ) {
                            $meetLink = $entryPoint->getUri();
                            Log::info(
                                'Found Meet link via conference data entry points',
                                [
                                    'event_id'  => $eventId,
                                    'meet_link' => $meetLink,
                                ],
                            );
                            break;
                        }
                    }
                }
            }

            if (! $meetLink) {
                Log::warning(
                    'Google Calendar event updated but no Meet link found',
                    [
                        'event_id'               => $eventId,
                        'hangout_link'           => $updatedEvent->hangoutLink,
                        'conference_data_exists' => $updatedEvent->getConferenceData() !== null,
                        'full_response'          => json_encode(
                            $updatedEvent->toSimpleObject(),
                        ),
                    ],
                );

                return null;
            }

            Log::info(
                'Successfully updated Google Calendar event with Meet link',
                [
                    'event_id'  => $eventId,
                    'meet_link' => $meetLink,
                ],
            );

            return $meetLink;
        } catch (Exception $e) {
            Log::error('Failed to add Meet link to Google Calendar event', [
                'event_id'   => $eventId,
                'error'      => $e->getMessage(),
                'error_code' => $e->getCode(),
                'trace'      => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    public function createEvent(ScheduledEventData $data): array
    {
        try {
            Log::info('Create Google Calendar Service Instance');
            $service = $this->service;

            Log::info('Create Google Calendar Event Instance');

            // Normalize attendees: accept either strings or arrays with {email, responseStatus, displayName}
            $normalizedAttendees = [];
            $seenEmails          = [];

            // Convert ScheduledEventData attendees to the expected format
            $attendeeList = $data->attendees ?? [];
            foreach ($attendeeList as $attendee) {
                $email          = null;
                $responseStatus = null;
                $displayName    = null;

                if (is_string($attendee)) {
                    $email = strtolower(trim($attendee));
                } elseif (is_array($attendee)) {
                    $email          = $attendee['email'] ?? ($attendee['name'] ?? null);
                    $email          = $email ? strtolower(trim((string) $email)) : null;
                    $responseStatus = $attendee['responseStatus'] ?? null;
                    $displayName    = $attendee['displayName']    ?? ($attendee['name'] ?? null);
                }

                if (! $email || isset($seenEmails[$email])) {
                    continue;
                }

                $seenEmails[$email] = true;

                $entry = ['email' => $email];
                if ($displayName) {
                    $entry['displayName'] = $displayName;
                }
                if ($responseStatus) {
                    $entry['responseStatus'] = $responseStatus;
                }
                $normalizedAttendees[] = $entry;
            }

            // Build event data array
            $eventData = [
                'summary'     => $data->name        ?? 'Untitled Event',
                'location'    => $data->location    ?? 'Online',
                'description' => $data->description ?? '',
                'start'       => [
                    'dateTime' => $data->start_at->format('c'),
                    'timeZone' => $data->timeZone ?? 'UTC',
                ],
                'end' => [
                    'dateTime' => $data->end_at->format('c'),
                    'timeZone' => $data->timeZone ?? 'UTC',
                ],
                'attendees' => $normalizedAttendees,
            ];

            // Conditionally add conference data for video conferencing
            $includeVideoConferencing = $data->source_data['include_video_conferencing'] ?? true;
            if ($includeVideoConferencing) {
                $eventData['conferenceData'] = [
                    'createRequest' => [
                        'requestId'             => uniqid(),
                        'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                    ],
                ];
            }

            $event = new \Google\Service\Calendar\Event($eventData);

            // Set optParams based on whether video conferencing is included
            $optParams = ['sendUpdates' => 'all'];
            if ($includeVideoConferencing) {
                $optParams['conferenceDataVersion'] = 1;
            }

            Log::info('Attempting to Insert Event to calendar');
            $createdEvent = $service->events->insert(
                'primary',
                $event,
                $optParams,
            );

            Log::info('Created Google Calendar event', [
                'event_id' => $createdEvent->getId(),
                'htmlLink' => $createdEvent->getHtmlLink(),
            ]);

            // Ensure organizer (creator) shows as "accepted" in the UI
            try {
                $organizerEmail = $createdEvent->getOrganizer()
                    ? $createdEvent->getOrganizer()->getEmail()
                    : null;

                if ($organizerEmail) {
                    $existingAttendees = $createdEvent->getAttendees() ?? [];

                    $needsUpdate    = false;
                    $foundOrganizer = false;

                    // Update existing organizer attendee to accepted if present
                    foreach ($existingAttendees as $attendee) {
                        if (
                            strtolower((string) $attendee->getEmail()) === strtolower($organizerEmail)
                        ) {
                            $foundOrganizer = true;
                            if ($attendee->getResponseStatus() !== 'accepted') {
                                $attendee->setResponseStatus('accepted');
                                $needsUpdate = true;
                            }
                            break;
                        }
                    }

                    // If organizer not listed as attendee, add as accepted attendee
                    if (! $foundOrganizer) {
                        $newAttendee = new \Google\Service\Calendar\EventAttendee();
                        $newAttendee->setEmail($organizerEmail);
                        $newAttendee->setResponseStatus('accepted');
                        $existingAttendees[] = $newAttendee;
                        $needsUpdate         = true;
                    }

                    if ($needsUpdate) {
                        $createdEvent->setAttendees($existingAttendees);

                        // Do not spam notifications; this only reflects organizer's own status
                        $updateParams = ['sendUpdates' => 'none'];
                        $createdEvent = $service->events->update(
                            'primary',
                            $createdEvent->getId(),
                            $createdEvent,
                            $updateParams,
                        );

                        Log::info(
                            'Updated event to mark organizer as accepted attendee',
                            [
                                'event_id'        => $createdEvent->getId(),
                                'organizer_email' => $organizerEmail,
                            ],
                        );
                    }
                }
            } catch (\Exception $acceptError) {
                Log::warning(
                    'Failed to explicitly set organizer RSVP to accepted; continuing',
                    [
                        'event_id' => $createdEvent->getId(),
                        'error'    => $acceptError->getMessage(),
                    ],
                );
            }

            // Return formatted response similar to original method
            return [
                'id'          => $createdEvent->getId(),
                'htmlLink'    => $createdEvent->getHtmlLink(),
                'summary'     => $createdEvent->getSummary(),
                'description' => $createdEvent->getDescription(),
                'location'    => $createdEvent->getLocation(),
                'start'       => [
                    'dateTime' => $createdEvent->getStart()->getDateTime(),
                    'timeZone' => $createdEvent->getStart()->getTimeZone(),
                ],
                'end' => [
                    'dateTime' => $createdEvent->getEnd()->getDateTime(),
                    'timeZone' => $createdEvent->getEnd()->getTimeZone(),
                ],
                'attendees' => $createdEvent->getAttendees() ? array_map(
                    fn ($attendee) => [
                        'email'          => $attendee->getEmail(),
                        'displayName'    => $attendee->getDisplayName(),
                        'responseStatus' => $attendee->getResponseStatus(),
                    ],
                    $createdEvent->getAttendees(),
                ) : [],
                'conferenceData' => $createdEvent->getConferenceData() ? [
                    'entryPoints' => array_map(
                        fn ($entryPoint) => [
                            'entryPointType' => $entryPoint->getEntryPointType(),
                            'uri'            => $entryPoint->getUri(),
                        ],
                        $createdEvent->getConferenceData()->getEntryPoints() ?? [],
                    ),
                ] : null,
            ];
        } catch (Exception $e) {
            Log::error('Failed to create Google Calendar event', [
                'error'      => $e->getMessage(),
                'event_name' => $data->name    ?? 'Unknown',
                'user_id'    => $data->user_id ?? $this->user->id,
            ]);

            throw new \Exception('Failed to create calendar event: '.$e->getMessage(), 0, $e);
        }
    }

    public function updateEvent(
        string $eventId,
        UpdateEventData $data,
        User $user,
    ): bool {
        try {
            Log::info('Starting updateEvent process', [
                'event_id' => $eventId,
                'data'     => $data->toGoogleCalendarArray(),
            ]);

            $service = $this->service;

            // Get the existing event
            try {
                $existingEvent = $service->events->get('primary', $eventId);
            } catch (\Exception $getError) {
                Log::error('Failed to fetch event from Google Calendar', [
                    'event_id' => $eventId,
                    'error'    => $getError->getMessage(),
                ]);

                return false;
            }

            if (! $existingEvent) {
                Log::error('Event not found in Google Calendar', [
                    'event_id' => $eventId,
                ]);

                return false;
            }

            // Verify current user is the organizer
            $currentUserEmail = $user->email;
            if (
                $existingEvent->getOrganizer() && $currentUserEmail && $currentUserEmail !== $existingEvent->getOrganizer()->getEmail()
            ) {
                Log::error('User is not the organizer, cannot update event', [
                    'event_id'        => $eventId,
                    'organizer_email' => $existingEvent
                        ->getOrganizer()
                        ->getEmail(),
                    'current_user_email' => $currentUserEmail,
                ]);

                return false;
            }

            // Update summary
            if ($data->name !== null) {
                $existingEvent->setSummary($data->name);
            }

            // Update description
            $existingEvent->setDescription($data->description ?? '');

            // Update location
            if ($data->location !== null) {
                $existingEvent->setLocation($data->location);
            }

            // Handle link / conference removal
            if ($data->hasLinkUpdate) {
                if (! empty($data->link)) {
                    Log::info(
                        'Custom link update detected, but hangoutLink is read-only. Ignoring direct set.',
                        [
                            'link' => $data->link,
                        ],
                    );
                } else {
                    Log::info('Removing Google Meet/Hangouts link from event', [
                        'event_id' => $eventId,
                    ]);
                    $existingEvent->setConferenceData(
                        new \Google\Service\Calendar\ConferenceData(),
                    );
                }
            }

            // Update start time
            if ($data->start_at !== null) {
                $startDateTime = new \Google\Service\Calendar\EventDateTime();
                $startDateTime->setDateTime($data->start_at->format('c'));
                $startDateTime->setTimeZone($user->timezone ?? 'UTC');
                $existingEvent->setStart($startDateTime);
            }

            // Update end time
            if ($data->end_at !== null) {
                $endDateTime = new \Google\Service\Calendar\EventDateTime();
                $endDateTime->setDateTime($data->end_at->format('c'));
                $endDateTime->setTimeZone($user->timezone ?? 'UTC');
                $existingEvent->setEnd($endDateTime);
            }

            // Update guests
            if (is_array($data->guests) && $data->guests !== null) {
                $attendees = [];

                // Always include the organizer as an accepted attendee
                $organizerEmail = $existingEvent->getOrganizer()?->getEmail();

                if ($organizerEmail) {
                    $attendees[] = [
                        'email'          => $organizerEmail,
                        'responseStatus' => 'accepted',
                    ];
                }

                // Add the new guests
                foreach ($data->guests as $guest) {
                    $guestEmail = is_array($guest)
                        ? $guest['name'] ?? ''
                        : (string) $guest;
                    if (filter_var($guestEmail, FILTER_VALIDATE_EMAIL)) {
                        // Don't add organizer twice if they're in the guests list
                        if (
                            ! $organizerEmail || strtolower($guestEmail) !== strtolower($organizerEmail)
                        ) {
                            $attendees[] = ['email' => $guestEmail];
                        }
                    }
                }

                $existingEvent->setAttendees($attendees);
            }

            // Ensure conferenceDataVersion is sent so Meet links can be removed
            $optParams = [
                'sendUpdates'           => 'all',
                'conferenceDataVersion' => 1,
            ];

            // Perform update
            try {
                $updatedEvent = $service->events->update(
                    'primary',
                    $eventId,
                    $existingEvent,
                    $optParams,
                );

                Log::info('Successfully updated Google Calendar event', [
                    'event_id'         => $eventId,
                    'updated_summary'  => $updatedEvent->getSummary(),
                    'has_hangout_link' => $updatedEvent->getHangoutLink() !== null,
                ]);

                return true;
            } catch (\Exception $updateError) {
                Log::error('Google Calendar API update call failed', [
                    'event_id' => $eventId,
                    'error'    => $updateError->getMessage(),
                ]);

                return false;
            }
        } catch (\Exception $e) {
            Log::error('Failed to update Google Calendar event', [
                'event_id' => $eventId,
                'error'    => $e->getMessage(),
            ]);

            return false;
        }
    }


    /**
     * Delete an event from Google Calendar
     */
    public function deleteEvent(string $eventId, User $user): bool
    {
        try {
            Log::info('Starting deleteEvent process', [
                'event_id' => $eventId,
            ]);

            $service = $this->service;

            // First, get the existing event to check permissions
            Log::info('Fetching existing Google Calendar event for deletion', [
                'event_id' => $eventId,
            ]);

            try {
                $existingEvent = $service->events->get('primary', $eventId);
            } catch (\Exception $getError) {
                Log::error(
                    'Failed to fetch event from Google Calendar for deletion',
                    [
                        'event_id'   => $eventId,
                        'error'      => $getError->getMessage(),
                        'error_code' => $getError->getCode(),
                    ],
                );

                return false;
            }

            if (! $existingEvent) {
                Log::error('Event not found in Google Calendar for deletion', [
                    'event_id' => $eventId,
                ]);

                return false;
            }

            $currentUserEmail = $user->email;

            // Check if current user is the organizer
            if (
                $existingEvent->getOrganizer() && $currentUserEmail && $currentUserEmail !== $existingEvent->getOrganizer()->getEmail()
            ) {
                Log::error(
                    'User is not the organizer of this event, cannot delete event',
                    [
                        'event_id'        => $eventId,
                        'organizer_email' => $existingEvent
                            ->getOrganizer()
                            ->getEmail(),
                        'current_user_email' => $currentUserEmail,
                    ],
                );

                return false;
            }

            $optParams = ['sendUpdates' => 'all'];

            Log::info('Attempting to delete Google Calendar event', [
                'event_id'   => $eventId,
                'opt_params' => $optParams,
            ]);

            try {
                $service->events->delete('primary', $eventId, $optParams);

                Log::info('Successfully deleted Google Calendar event', [
                    'event_id' => $eventId,
                ]);

                return true;
            } catch (\Exception $deleteError) {
                Log::error('Google Calendar API delete call failed', [
                    'event_id'   => $eventId,
                    'error'      => $deleteError->getMessage(),
                    'error_code' => $deleteError->getCode(),
                    'trace'      => $deleteError->getTraceAsString(),
                ]);

                return false;
            }
        } catch (Exception $e) {
            Log::error('Failed to delete Google Calendar event', [
                'event_id'   => $eventId,
                'error'      => $e->getMessage(),
                'error_code' => $e->getCode(),
                'trace'      => $e->getTraceAsString(),
            ]);

            return false;
        }
    }


    public function getClient(): Client
    {
        return $this->client;
    }

    public function getService(): Calendar
    {
        return $this->service;
    }

    /**
     * Create a watch channel to receive push notifications for calendar events.
     *
     * @param  string       $webhookUrl  The URL where Google will send notifications
     * @param  int          $ttl         Time-to-live in seconds (max 604800 = 7 days)
     * @param  string       $calendarId  The calendar ID to watch (default: 'primary')
     * @param  string|null  $token       Optional token for identifying the channel (e.g., user ID)
     * @return array|null   Channel resource with id, resourceId, expiration, and token
     */
    public function createWatch(
        string $webhookUrl,
        int $ttl = 604800,
        string $calendarId = 'primary',
        ?string $token = null,
    ): ?array {
        try {
            $channel = new \Google\Service\Calendar\Channel();

            // Google requires channel IDs to match [A-Za-z0-9\-_\+/=]+ (no dots)
            // Use a hex string to guarantee compliance
            $channelId = bin2hex(random_bytes(16));
            $channel->setId($channelId);
            $channel->setType('web_hook');
            $channel->setAddress($webhookUrl);

            // Use provided token (e.g., user ID) or generate a random one
            // Token must be compliant with [A-Za-z0-9\-_\+/=]+
            $channel->setToken($token ?? bin2hex(random_bytes(16)));

            // Set expiration time (current time + TTL) in milliseconds
            $expiration = (time() + $ttl) * 1000;
            $channel->setExpiration($expiration);

            Log::info('Creating watch channel for Google Calendar', [
                'calendar_id' => $calendarId,
                'webhook_url' => $webhookUrl,
                'ttl'         => $ttl,
                'expiration'  => $expiration,
            ]);

            $channelResponse = $this->service->events->watch($calendarId, $channel);

            if (! $channelResponse) {
                Log::error('Failed to create watch channel - no response', [
                    'calendar_id' => $calendarId,
                    'webhook_url' => $webhookUrl,
                ]);

                return null;
            }

            $result = [
                'id'         => $channelResponse->getId(),
                'resourceId' => $channelResponse->getResourceId(),
                'expiration' => $channelResponse->getExpiration(),
                'token'      => $channel->getToken(),
            ];

            Log::info('Successfully created watch channel', [
                'channel_id'  => $result['id'],
                'resource_id' => $result['resourceId'],
                'expiration'  => $result['expiration'],
            ]);

            return $result;
        } catch (Exception $e) {
            Log::error('Failed to create watch channel for Google Calendar', [
                'calendar_id' => $calendarId,
                'webhook_url' => $webhookUrl,
                'error'       => $e->getMessage(),
                'error_code'  => $e->getCode(),
                'trace'       => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Stop a watch channel to stop receiving push notifications.
     *
     * @param  string  $resourceId  The resourceId from the watch channel
     * @param  string  $channelId   The channel ID from the watch channel
     * @return bool    True if successful, false otherwise
     */
    public function stopWatch(string $resourceId, string $channelId): bool
    {
        try {
            $channel = new \Google\Service\Calendar\Channel();
            $channel->setId($channelId);
            $channel->setResourceId($resourceId);

            Log::info('Stopping watch channel for Google Calendar', [
                'channel_id'  => $channelId,
                'resource_id' => $resourceId,
            ]);

            $this->service->channels->stop($channel);

            Log::info('Successfully stopped watch channel', [
                'channel_id'  => $channelId,
                'resource_id' => $resourceId,
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to stop watch channel for Google Calendar', [
                'channel_id'  => $channelId,
                'resource_id' => $resourceId,
                'error'       => $e->getMessage(),
                'error_code'  => $e->getCode(),
                'trace'       => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Handle a Google Calendar webhook notification and perform delta sync if needed.
     *
     * @param  array  $notificationData  Webhook notification payload
     * @return array|null  Result containing sync data or null on failure
     */
    public function handleWebhookNotification(array $notificationData): ?array
    {
        try {
            Log::info('Processing Google Calendar webhook notification', [
                'notification_data' => $notificationData,
            ]);

            $state         = $notificationData['state']         ?? null;
            $channelId     = $notificationData['channelId']     ?? null;
            $resourceId    = $notificationData['resourceId']    ?? null;
            $resourceUri   = $notificationData['resourceUri']   ?? null;
            $resourceState = $notificationData['resourceState'] ?? null;

            if (! $resourceState) {
                Log::warning('Webhook notification missing resourceState', [
                    'notification_data' => $notificationData,
                ]);

                return null;
            }

            $result = [
                'channel_id'     => $channelId,
                'resource_id'    => $resourceId,
                'resource_uri'   => $resourceUri,
                'resource_state' => $resourceState,
                'state'          => $state,
            ];

            if ($resourceState === 'exists') {
                Log::info('Calendar events changed, sync needed', [
                    'resource_id' => $resourceId,
                ]);

                $prevSyncToken           = $notificationData['prevSyncToken'] ?? null;
                $delta                   = $this->syncDelta($prevSyncToken);
                $result['items']         = $delta['items']         ?? [];
                $result['nextSyncToken'] = $delta['nextSyncToken'] ?? null;
                $result['sync_required'] = true;
            } elseif ($resourceState === 'not_exists') {
                Log::info('Calendar resource no longer exists', [
                    'resource_id' => $resourceId,
                ]);
                $result['sync_required'] = false;
            }

            return $result;
        } catch (Exception $e) {
            Log::error('Failed to handle webhook notification', [
                'notification_data' => $notificationData,
                'error'             => $e->getMessage(),
                'error_code'        => $e->getCode(),
            ]);

            return null;
        }
    }

    /**
     * List events from Google Calendar with sync token support.
     * This method implements the robust workflow for syncing Google Calendar events.
     *
     * @param  array{
        *     syncToken?: string|null,
        *     timeMin?: string,
        *     timeMax?: string,
        *     timezone?: string,
        *     showDeleted?: bool,
        *     updatedMin?: string|null // e.g. "2025-01-01" or ISO8601 datetime
     * } $params
     * @return array  Array with 'items' (events with status) and 'nextSyncToken'
     */
    public function listEvents(array $params = []): array
    {
        $items         = [];
        $nextSyncToken = null;

        try {
            $timezone  = $params['timezone']  ?? 'UTC';
            $syncToken = $params['syncToken'] ?? null;

            // Build base parameters
            $optParams = [
                'singleEvents' => true,
                'maxResults'   => 1000,
            ];

            if ($syncToken) {
                // Use sync token for incremental sync
                $optParams['syncToken'] = $syncToken;
            } else {
                // No sync token - set time range (timeMin -> today, timeMax -> 3 months from today)
                $timeMin = isset($params['timeMin'])
                    ? new \DateTime($params['timeMin'], new \DateTimeZone($timezone))
                    : new \DateTime('now', new \DateTimeZone($timezone));
                $timeMin->setTime(0, 0, 0);

                $timeMax = isset($params['timeMax'])
                    ? new \DateTime($params['timeMax'], new \DateTimeZone($timezone))
                    : (new \DateTime('now', new \DateTimeZone($timezone)))->modify('+3 months');
                $timeMax->setTime(23, 59, 59);

                // Use provided updatedMin if present, otherwise null (no filter)
                $updatedMin = isset($params['updatedMin'])
                    ? new \DateTime($params['updatedMin'], new \DateTimeZone($timezone))
                    : null;

                $optParams['timeMin']  = $timeMin->format('c');
                $optParams['timeMax']  = $timeMax->format('c');
                $optParams['timeZone'] = $timezone;
                $optParams['showDeleted'] = $params['showDeleted'] ?? false;

                // Only include updatedMin when provided (keep null/omitted otherwise)
                if ($updatedMin !== null) {
                    $optParams['updatedMin'] = $updatedMin->format('c');
                }
            }

            Log::info('Google Calendar listEvents optParams', [
                'opt_params' => $optParams,
                'user_id'    => $this->user->id,
            ]);

            // Handle pagination
            do {
                $results = $this->service->events->listEvents('primary', $optParams);

                foreach ($results->getItems() as $event) {
                    $items[] = [
                        'id'          => $event->getId(),
                        'status'      => $event->getStatus(), // Include status: confirmed, cancelled, etc.
                        'summary'     => $event->getSummary() ?? 'Untitled Event',
                        'description' => $event->getDescription(),
                        'location'    => $event->getLocation(),
                        'start'       => [
                            'dateTime' => $event->getStart()?->getDateTime()
                                ? (new \DateTime($event->getStart()->getDateTime()))
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->format('Y-m-d H:i:s')
                                : ($event->getStart()?->getDate()
                                    ? (new \DateTime($event->getStart()->getDate()))
                                        ->setTimezone(new \DateTimeZone($timezone))
                                        ->format('Y-m-d H:i:s')
                                    : null),
                            'timeZone' => $event->getStart()?->getTimeZone() ?? $timezone,
                        ],
                        'end' => [
                            'dateTime' => $event->getEnd()?->getDateTime()
                                ? (new \DateTime($event->getEnd()->getDateTime()))
                                    ->setTimezone(new \DateTimeZone($timezone))
                                    ->format('Y-m-d H:i:s')
                                : ($event->getEnd()?->getDate()
                                    ? (new \DateTime($event->getEnd()->getDate()))
                                        ->setTimezone(new \DateTimeZone($timezone))
                                        ->format('Y-m-d H:i:s')
                                    : null),
                            'timeZone' => $event->getEnd()?->getTimeZone() ?? $timezone,
                        ],
                        'attendees' => $event->getAttendees()
                            ? array_map(
                                fn ($attendee) => [
                                    'email'          => $attendee->getEmail(),
                                    'displayName'    => $attendee->getDisplayName(),
                                    'responseStatus' => $attendee->getResponseStatus(),
                                ],
                                $event->getAttendees(),
                            )
                            : [],
                        'conferenceData' => $event->getConferenceData()
                            ? [
                                'entryPoints' => array_map(
                                    fn ($entryPoint) => [
                                        'entryPointType' => $entryPoint->getEntryPointType(),
                                        'uri'            => $entryPoint->getUri(),
                                    ],
                                    $event->getConferenceData()->getEntryPoints(),
                                ),
                            ]
                            : null,
                        'recurring_meeting_id' => $event->getRecurringEventId(),
                        'updated'              => $event->getUpdated(),
                    ];
                }

                $pageToken = $results->getNextPageToken();
                if ($pageToken) {
                    $optParams['pageToken'] = $pageToken;
                } else {
                    $nextSyncToken = $results->getNextSyncToken();
                }
            } while (! empty($pageToken));

            return [
                'items'         => $items,
                'nextSyncToken' => $nextSyncToken,
            ];
        } catch (\Google\Service\Exception $e) {
            // Handle invalid sync token (HTTP 410): reset and perform full sync
            if ((int) $e->getCode() === 410) {
                Log::warning('Invalid Google Calendar sync token, performing full sync', [
                    'error' => $e->getMessage(),
                ]);

                // Retry without sync token
                unset($params['syncToken']);
                return $this->listEvents($params);
            }

            Log::error('Failed to list events from Google Calendar', [
                'error' => $e->getMessage(),
                'code'  => $e->getCode(),
            ]);

            return [
                'items'         => [],
                'nextSyncToken' => $nextSyncToken,
            ];
        } catch (Exception $e) {
            Log::error('Failed to list events from Google Calendar', [
                'error' => $e->getMessage(),
            ]);

            return [
                'items'         => [],
                'nextSyncToken' => $nextSyncToken,
            ];
        }
    }

    /**
     * Perform incremental (delta) sync of calendar events.
     *
     * @param  string|null  $syncToken  Previous sync token for incremental sync
     * @param  string  $calendarId  Calendar ID to sync (default: 'primary')
     * @return array  Array with 'items' and 'nextSyncToken'
     */
    public function syncDelta(?string $syncToken = null, string $calendarId = 'primary'): array
    {
        $items         = [];
        $nextSyncToken = null;

        try {
            $params = [
                'singleEvents' => true,
                'showDeleted'  => true,
                'maxResults'   => 2500,
            ];

            if ($syncToken) {
                $params['syncToken'] = $syncToken;
            } else {
                // Initial window for first sync: last 7 days to +60 days
                $timeMin           = (new \DateTimeImmutable('-7 days'))->format('c');
                $timeMax           = (new \DateTimeImmutable('+60 days'))->format('c');
                $params['timeMin'] = $timeMin;
                $params['timeMax'] = $timeMax;
            }

            do {
                $results = $this->service->events->listEvents($calendarId, $params);

                foreach ($results->getItems() as $event) {
                    $originalStartTime = $event->getOriginalStartTime();
                    $items[]           = [
                        'id'          => $event->getId(),
                        'status'      => $event->getStatus(),
                        'summary'     => $event->getSummary() ?? 'Untitled Event',
                        'description' => $event->getDescription(),
                        'location'    => $event->getLocation(),
                        'start'       => [
                            'dateTime' => $event->getStart()?->getDateTime() ?: $event->getStart()?->getDate(),
                            'timeZone' => $event->getStart()?->getTimeZone(),
                        ],
                        'end' => [
                            'dateTime' => $event->getEnd()?->getDateTime() ?: $event->getEnd()?->getDate(),
                            'timeZone' => $event->getEnd()?->getTimeZone(),
                        ],
                        'recurring_meeting_id' => $event->getRecurringEventId(),
                        'originalStartTime'    => $originalStartTime ? [
                            'dateTime' => $originalStartTime->getDateTime() ?: $originalStartTime->getDate(),
                            'timeZone' => $originalStartTime->getTimeZone() ?? null,
                        ] : null,
                        'attendees' => array_map(
                            fn ($a) => [
                                'email'          => $a->getEmail(),
                                'displayName'    => $a->getDisplayName(),
                                'responseStatus' => $a->getResponseStatus(),
                            ],
                            $event->getAttendees() ?: [],
                        ),
                        'conferenceData' => $event->getConferenceData() ? [
                            'entryPoints' => array_map(
                                fn ($ep) => [
                                    'entryPointType' => $ep->getEntryPointType(),
                                    'uri'            => $ep->getUri(),
                                ],
                                $event->getConferenceData()->getEntryPoints() ?: [],
                            ),
                        ] : null,
                        'updated' => $event->getUpdated(),
                    ];
                }

                $pageToken = $results->getNextPageToken();
                if ($pageToken) {
                    $params['pageToken'] = $pageToken;
                } else {
                    $nextSyncToken = $results->getNextSyncToken();
                }
            } while (! empty($params['pageToken']));

            return ['items' => $items, 'nextSyncToken' => $nextSyncToken];
        } catch (\Google\Service\Exception $e) {
            // Handle invalid sync token (HTTP 410): start a full sync window
            if ((int) $e->getCode() === 410) {
                Log::warning('Invalid Google Calendar sync token, performing full delta window');

                return $this->syncDelta(null, $calendarId);
            }

            Log::error('Google Calendar delta sync error', [
                'error' => $e->getMessage(),
                'code'  => $e->getCode(),
            ]);

            return ['items' => [], 'nextSyncToken' => $nextSyncToken];
        } catch (Exception $e) {
            Log::error('Delta sync failed', [
                'error' => $e->getMessage(),
            ]);

            return ['items' => [], 'nextSyncToken' => $nextSyncToken];
        }
    }
}
