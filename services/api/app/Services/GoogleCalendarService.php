<?php

namespace App\Services;

use App\DataTransferObjects\UpdateEventData;
use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Models\User;
use Exception;
use Google\Client;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private Client $client;

    private ?string $refreshToken = null;

    private ?User $user = null;

    public function __construct(User|string|null $userOrRefreshToken = null)
    {
        $this->client = new Client();

        $this->client->setClientId(
            config('google-calendar.auth_profiles.oauth.client_id'),
        );
        $this->client->setClientSecret(
            config('google-calendar.auth_profiles.oauth.client_secret'),
        );
        $this->client->setAccessType('offline');
        $this->client->setIncludeGrantedScopes(true);
        $this->client->setPrompt('consent');
        $this->client->setScopes([
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
        ]);

        // Handle User object or refresh token string
        if ($userOrRefreshToken instanceof User) {
            $this->user = $userOrRefreshToken;
            $this->initializeWithUser($userOrRefreshToken);
        } elseif (is_string($userOrRefreshToken) && ! empty($userOrRefreshToken)) {
            $this->refreshToken = $userOrRefreshToken;
            $this->initializeWithRefreshToken($userOrRefreshToken);
        }
    }

    /**
     * Initialize the service with a User object, checking expiration before refreshing
     */
    private function initializeWithUser(User $user): void
    {
        $credentials = $user->google_calendar_credentials;
        $this->refreshToken = $credentials['refresh_token'] ?? null;

        if (! $this->refreshToken) {
            Log::warning('No refresh token available for user', [
                'user_id' => $user->id,
            ]);

            return;
        }

        // Check if token is expired using stored expires_at
        $shouldRefresh = $this->shouldRefreshToken($user, $credentials);

        if ($shouldRefresh) {
            $this->refreshTokenAndSetClient($user);
        } else {
            // Set existing access token without refreshing
            $accessTokenData = $credentials['access_token'];

            // Try to decode if it's a JSON string, otherwise use as-is
            if (is_string($accessTokenData)) {
                $decoded = json_decode($accessTokenData, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $accessTokenData = $decoded;
                } else {
                    // If it's just a token string, create array format
                    $accessTokenData = ['access_token' => $accessTokenData];
                }
            }

            $this->client->setAccessToken($accessTokenData);

            Log::debug('Using existing access token without refresh', [
                'user_id' => $user->id,
            ]);
        }
    }

    /**
     * Initialize the service with just a refresh token (legacy support)
     */
    private bool $isValidToken = true;

    public function isValid(): bool
    {
        return $this->isValidToken;
    }

    private function initializeWithRefreshToken(string $refreshToken): void
    {
        try {
            $accessToken = $this->client->fetchAccessTokenWithRefreshToken(
                $refreshToken,
            );

            // Check if the response contains an error
            if (isset($accessToken['error'])) {
                Log::error(
                    'Error fetching access token with refresh token in constructor',
                    [
                        'error'             => $accessToken['error'],
                        'error_description' => $accessToken['error_description'] ?? 'No description provided',
                    ],
                );

                $this->isValidToken = false;

                return;
            }

            $this->client->setAccessToken($accessToken);

            Log::info(
                'Successfully initialized GoogleCalendarService with refresh token',
            );
        } catch (\Exception $e) {
            Log::error(
                'Failed to initialize GoogleCalendarService with refresh token',
                [
                    'error' => $e->getMessage(),
                ],
            );

            $this->isValidToken = false;
        }
    }

    public function __construct(User|string|null $userOrRefreshToken = null)
    {
        $this->client = new Client();

        $this->client->setClientId(
            config('google-calendar.auth_profiles.oauth.client_id'),
        );
        $this->client->setClientSecret(
            config('google-calendar.auth_profiles.oauth.client_secret'),
        );
        $this->client->setAccessType('offline');
        $this->client->setIncludeGrantedScopes(true);
        $this->client->setPrompt('consent');
        $this->client->setScopes([
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
        ]);

        // Handle User object or refresh token string
        if ($userOrRefreshToken instanceof User) {
            $this->user = $userOrRefreshToken;
            $this->initializeWithUser($userOrRefreshToken);
        } elseif (is_string($userOrRefreshToken) && ! empty($userOrRefreshToken)) {
            $this->refreshToken = $userOrRefreshToken;
            $this->initializeWithRefreshToken($userOrRefreshToken);
        }
    }

    /**
     * Check if token should be refreshed based on stored expires_at
     *
     * @param bool $setTokenOnClient Whether to set the token on the client for expiration check
     */
    private function shouldRefreshToken(User $user, array $credentials, bool $setTokenOnClient = true): bool
    {
        // First, try to use stored expires_at if available
        if (isset($credentials['expires_at']) && $credentials['expires_at']) {
            $expiresAt = $credentials['expires_at'];

            if ($expiresAt instanceof Carbon) {
                // Add a 60 second buffer to refresh before actual expiration
                return Carbon::now()->addSeconds(60)->greaterThanOrEqualTo($expiresAt);
            } elseif (is_string($expiresAt)) {
                $expiresAt = Carbon::parse($expiresAt);
                return Carbon::now()->addSeconds(60)->greaterThanOrEqualTo($expiresAt);
            }
        }

        // Fallback to Google Client's expiration check if expires_at not stored
        $accessTokenData = $credentials['access_token'] ?? null;

        if (! $accessTokenData) {
            // No access token, need to refresh
            return true;
        }

        // Only set token on client if requested (to avoid overwriting existing token)
        if ($setTokenOnClient) {
            // Try to decode if it's a JSON string, otherwise use as-is
            if (is_string($accessTokenData)) {
                $decoded = json_decode($accessTokenData, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $accessTokenData = $decoded;
                } else {
                    // If it's just a token string, create array format
                    $accessTokenData = ['access_token' => $accessTokenData];
                }
            }

            $this->client->setAccessToken($accessTokenData);
        }

        try {
            return $this->client->isAccessTokenExpired();
        } catch (\Exception $e) {
            // If we can't determine expiration, assume token is valid
            // This prevents unnecessary refresh calls
            Log::debug('Could not determine token expiration, assuming valid', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Refresh token and update user's stored credentials
     */
    private function refreshTokenAndSetClient(User $user): void
    {
        try {
            Log::info('Access token expired, refreshing token', [
                'user_id' => $user->id,
            ]);

            $accessToken = $this->client->fetchAccessTokenWithRefreshToken(
                $this->refreshToken,
            );

            // Check if the response contains an error
            if (isset($accessToken['error'])) {
                Log::error(
                    'Error fetching access token with refresh token',
                    [
                        'error'             => $accessToken['error'],
                        'error_description' => $accessToken['error_description'] ?? 'No description provided',
                        'user_id'           => $user->id,
                    ],
                );

                throw new \Exception(
                    "Failed to refresh access token: {$accessToken['error_description']}",
                );
            }

            $this->client->setAccessToken($accessToken);

            // Update user's stored credentials with new token and expiration
            $credentials = [
                'access_token'  => $accessToken['access_token'],
                'refresh_token' => $accessToken['refresh_token'] ?? $this->refreshToken,
                'expires_at'    => Carbon::now()->addSeconds($accessToken['expires_in'] ?? 3600),
            ];

            $user->updateGoogleCalendarToken($credentials);

            Log::info(
                'Successfully refreshed Google Calendar access token',
                [
                    'user_id' => $user->id,
                ],
            );
        } catch (\Exception $e) {
            Log::error(
                'Failed to refresh Google Calendar access token',
                [
                    'error'   => $e->getMessage(),
                    'user_id' => $user->id,
                ],
            );

            throw $e;
        }
    }

    public function refreshAccessToken(): array
    {
        if (! $this->refreshToken) {
            throw new \Exception('Refresh token is not set in service');
        }

        $newToken = $this->client->fetchAccessTokenWithRefreshToken(
            $this->refreshToken,
        );

        if (isset($newToken['error'])) {
            throw new \Exception(
                "Failed to refresh token: {$newToken['error_description']}",
            );
        }

        $this->client->setAccessToken($newToken);

        // Update user's stored credentials if user is available
        if ($this->user) {
            $credentials = [
                'access_token'  => $newToken['access_token'],
                'refresh_token' => $newToken['refresh_token'] ?? $this->refreshToken,
                'expires_at'    => Carbon::now()->addSeconds($newToken['expires_in'] ?? 3600),
            ];

            $this->user->updateGoogleCalendarToken($credentials);

            Log::debug('Updated user credentials after token refresh', [
                'user_id' => $this->user->id,
            ]);
        }

        return $newToken;
    }

    public function setAccessToken(array|string $token): void
    {
        if (is_array($token)) {
            $this->client->setAccessToken($token);
            if (! empty($token['refresh_token'])) {
                $this->refreshToken = $token['refresh_token'];
            }
        } else {
            $this->client->setAccessToken(['access_token' => $token]);
        }
    }

    public function isAccessTokenExpired(): bool
    {
        return $this->client->isAccessTokenExpired();
    }

    /**
     * Validate if the refresh token is still valid
     */
    public function validateRefreshToken(): bool
    {
        if (! $this->refreshToken) {
            Log::warning('No refresh token available for validation');

            return false;
        }

        try {
            $testToken = $this->client->fetchAccessTokenWithRefreshToken(
                $this->refreshToken,
            );

            if (isset($testToken['error'])) {
                Log::error('Refresh token validation failed', [
                    'error'             => $testToken['error'],
                    'error_description' => $testToken['error_description'] ?? 'No description provided',
                ]);

                return false;
            }

            Log::info('Refresh token validation successful');

            return true;
        } catch (\Exception $e) {
            Log::error('Exception during refresh token validation', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Verify that the Google Calendar connection is working by making a simple API call.
     * This checks if the credentials are valid and the API is accessible.
     *
     * @return bool True if connection is working, false otherwise
     */
    public function verifyConnection(): bool
    {
        try {
            // Check if token needs refresh using stored expiration or client check
            $needsRefresh = false;

            if ($this->user) {
                $credentials = $this->user->google_calendar_credentials;
                // Check expiration using stored expires_at first (doesn't require setting token)
                if (isset($credentials['expires_at']) && $credentials['expires_at']) {
                    $expiresAt = $credentials['expires_at'];
                    if ($expiresAt instanceof Carbon) {
                        $needsRefresh = Carbon::now()->addSeconds(60)->greaterThanOrEqualTo($expiresAt);
                    } elseif (is_string($expiresAt)) {
                        $expiresAt = Carbon::parse($expiresAt);
                        $needsRefresh = Carbon::now()->addSeconds(60)->greaterThanOrEqualTo($expiresAt);
                    }
                } else {
                    // Fallback to client check if expires_at not stored
                    $needsRefresh = $this->client->isAccessTokenExpired();
                }
            } else {
                // Fallback to client check if no user available
                $needsRefresh = $this->client->isAccessTokenExpired();
            }

            if ($needsRefresh) {
                $this->refreshAccessToken();
            }

            $service = new \Google\Service\Calendar($this->client);

            // Make a simple read-only API call to verify connection
            // Get calendar settings - this is a lightweight call that verifies access
            $calendar = $service->calendars->get('primary');

            if (! $calendar) {
                Log::warning('Connection verification failed - no calendar returned');

                return false;
            }

            Log::debug('Connection verification successful', [
                'calendar_id' => $calendar->getId(),
            ]);

            return true;
        } catch (Exception $e) {
            Log::warning('Connection verification failed', [
                'error'      => $e->getMessage(),
                'error_code' => $e->getCode(),
            ]);

            return false;
        }
    }

    public function authenticate(string $code): array
    {
        Log::info('Attempting to authenticate with Google code', [
            'code_prefix' => substr($code, 0, 10).'...',
        ]);

        $cacheKey = 'google_calendar_tokens_'.md5($code);
        $cached   = Cache::get($cacheKey);

        if ($cached) {
            Log::info('Using cached tokens for code', ['code' => $code]);

            return $this->formatResponse($cached);
        }

        $token = $this->client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new Exception(
                "Token error: {$token['error']} - {$token['error_description']}",
            );
        }

        Cache::put($cacheKey, $token, 300);

        return $this->formatResponse($token);
    }

    private function formatResponse(array $token): array
    {
        try {
            $this->client->setAccessToken($token);
            $service      = new \Google\Service\Calendar($this->client);
            $calendarList = $service->calendarList->get('primary');
            $email        = $calendarList->getId();

            return [
                'accessToken'  => $token['access_token'],
                'refreshToken' => $token['refresh_token'] ?? '',
                'email'        => $email,
            ];
        } catch (Exception $e) {
            Log::error('Failed to fetch user email from Google Calendar', [
                'error' => $e->getMessage(),
            ]);

            return [
                'accessToken'  => $token['access_token'],
                'refreshToken' => $token['refresh_token'] ?? '',
                'email'        => '',
            ];
        }
    }

    public function getUpcomingEvents(
        ?string $fromDate = null,
        ?string $toDate = null,
        ?User $user = null,
        ?Pulse $pulse = null,
        ?bool $filter = true,
    ): array {
        try {
            if ($this->client->isAccessTokenExpired()) {
                Log::info('Access token expired. Refreshing...');
                $this->refreshAccessToken();
            }

            $service  = new \Google\Service\Calendar($this->client);
            $user     = $user ?? Auth::user();
            $timezone = $user->timezone;

            // Set default time range if not provided
            $timeMin = $fromDate
                ? new \DateTime($fromDate, new \DateTimeZone($timezone))
                : new \DateTime('now', new \DateTimeZone($timezone));
            $today = new \DateTime('now', new \DateTimeZone($timezone));
            $today->setTime(0, 0, 0);

            if (
                ! $fromDate || $timeMin->format('Y-m-d') === $today->format('Y-m-d')
            ) {
                // When no fromDate is provided or fromDate is today, use current time
                $timeMin = new \DateTime('now', new \DateTimeZone($timezone));
            } else {
                $timeMin->setTime(0, 0, 0);
            }

            $timeMax = $toDate
                ? new \DateTime($toDate, new \DateTimeZone($timezone))
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

            if ($filter) {
                // Get already imported event IDs from the database
                $importedEventIds = MeetingSession::whereNotNull(
                    'gcal_meeting_id',
                )
                    ->when(
                        $pulse && $pulse->id,
                        fn ($query) => $query->where('pulse_id', $pulse->id),
                    )
                    ->when(
                        $user && $user->id,
                        fn ($query) => $query->where('user_id', $user->id),
                    )
                    ->pluck('gcal_meeting_id')
                    ->toArray();

                // Filter out already imported events
                $events = array_filter($events, function ($event) use (
                    $importedEventIds
                ) {
                    return ! in_array($event->getId(), $importedEventIds);
                });

                \Log::info('Filtered upcoming events', [
                    'total_events' => count($events),
                    'imported_ids' => count($importedEventIds),
                ]);
            }

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
     * Get a single event from Google Calendar by its ID
     */
    public function getEventById(string $eventId, ?User $user = null): ?array
    {
        try {
            if ($this->client->isAccessTokenExpired()) {
                Log::info('Access token expired. Refreshing...');
                $this->refreshAccessToken();
            }

            $service  = new \Google\Service\Calendar($this->client);
            $timezone = $user->timezone ?? Auth::user()->timezone;

            Log::info('Fetching single event from Google Calendar', [
                'event_id' => $eventId,
                'timezone' => $timezone,
            ]);

            $event = $service->events->get('primary', $eventId);

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

    public function createEvent(array $data): ?\Google\Service\Calendar\Event
    {
        try {
            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before event creation. Refreshing...',
                );

                try {
                    $this->refreshAccessToken();
                } catch (\Exception $refreshError) {
                    Log::error(
                        'Failed to refresh access token during event creation',
                        [
                            'error' => $refreshError->getMessage(),
                        ],
                    );

                    // If refresh fails, the token is likely invalid
                    return null;
                }
            }

            Log::info('Create Gooel Calendar Service Instance');
            $service = new \Google\Service\Calendar($this->client);

            Log::info('Create Gooel Calendar Event Instance');

            // Normalize attendees: accept either strings or arrays with {email, responseStatus, displayName}
            $normalizedAttendees = [];
            $seenEmails          = [];
            foreach ($data['attendees'] ?? [] as $attendee) {
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
                'summary'     => $data['summary'] ?? 'Untitled Event',
                'location'    => 'Online',
                'description' => $data['description'] ?? '',
                'start'       => [
                    'dateTime' => $data['start'],
                    'timeZone' => $data['timeZone'] ?? 'UTC',
                ],
                'end' => [
                    'dateTime' => $data['end'],
                    'timeZone' => $data['timeZone'] ?? 'UTC',
                ],
                'attendees' => $normalizedAttendees,
            ];

            // Conditionally add conference data for video conferencing
            $includeVideoConferencing = $data['include_video_conferencing'] ?? true;
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

            return $createdEvent;
        } catch (\Google\Service\Exception $e) {
            // Extract meaningful error message from Google API response
            $errorMessage = $e->getMessage();
            $errors       = $e->getErrors();

            if (! empty($errors) && isset($errors[0]['message'])) {
                $errorMessage = $errors[0]['message'];
            }

            Log::error('Failed to create Google Calendar event', [
                'error'      => $errorMessage,
                'error_code' => $e->getCode(),
                'errors'     => $errors,
            ]);

            // Throw with the actual Google API error message
            throw new \RuntimeException(
                "Failed to create Google Calendar event: {$errorMessage}",
                $e->getCode(),
                $e,
            );
        } catch (Exception $e) {
            Log::error('Failed to create Google Calendar event', [
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException(
                'Failed to create Google Calendar event: ' . $e->getMessage(),
                $e->getCode(),
                $e,
            );
        }
    }

    public function getNextRecurringInstance(
        MeetingSession $meetingSession,
    ): ?\Google\Service\Calendar\Event {
        try {
            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before fetching recurring instance. Refreshing...',
                );
                $this->refreshAccessToken();
            }

            if ($meetingSession->recurring_meeting_id === null) {
                Log::warning('No recurring meeting ID found for session', [
                    'meeting_session_id' => $meetingSession->id,
                ]);

                return null;
            }

            $timezone           = $meetingSession->timezone ?? (Auth::user()->timezone ?? 'UTC');
            $recurringMeetingId = $meetingSession->recurring_meeting_id;
            $service            = new \Google\Service\Calendar($this->client);

            // Use the end time of the current session + 1 second as the lower bound for the next instance
            $timeMin = (new \DateTime(
                $meetingSession->end_at,
                new \DateTimeZone($timezone),
            ))->modify('+30 second');

            $optParams = [
                'timeMin'    => $timeMin->format('c'),
                'maxResults' => 1,
                'timeZone'   => $timezone,
            ];

            $results = $service->events->instances(
                'primary',
                $recurringMeetingId,
                $optParams,
            );
            $instances = $results->getItems();

            if (empty($instances)) {
                Log::warning('No next occurrence found for recurring event', [
                    'recurring_meeting_id' => $recurringMeetingId,
                ]);

                return null;
            }

            return $instances[0];
        } catch (Exception $e) {
            Log::error('Failed to fetch next recurring instance', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function addMeetLinkToEvent(string $eventId, User $user): ?string
    {
        try {
            Log::info('Starting addMeetLinkToEvent process', [
                'event_id' => $eventId,
            ]);

            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before updating event. Refreshing...',
                );

                try {
                    $newTokenData = $this->refreshAccessToken();
                    // Make sure the client uses the new access token
                    $this->client->setAccessToken($newTokenData);
                    Log::info('Access token refreshed and set on client');
                } catch (\Exception $refreshError) {
                    Log::error(
                        'Failed to refresh access token during event update',
                        [
                            'error' => $refreshError->getMessage(),
                            'trace' => $refreshError->getTraceAsString(),
                        ],
                    );

                    return null;
                }
            }

            $service = new \Google\Service\Calendar($this->client);

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
            $organizerEmail = $existingEvent->getOrganizer()
                ? $existingEvent->getOrganizer()->getEmail()
                : null;
            $isOrganizer = $currentUserEmail && $organizerEmail && $currentUserEmail === $organizerEmail;

            Log::info(
                'Event found, checking existing conference data first',
                [
                    'event_id'            => $eventId,
                    'has_conference_data' => $existingEvent->getConferenceData() !== null,
                    'organizer_email'     => $organizerEmail,
                    'current_user_email'  => $currentUserEmail,
                    'is_organizer'        => $isOrganizer,
                ],
            );

            // IMPORTANT: Check if it already has conference data (Meet link) BEFORE checking organizer
            // This allows us to return existing links even if user is not the organizer
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
                        Log::info('Event already has a Meet link, returning existing link', [
                            'event_id'  => $eventId,
                            'meet_link' => $entryPoint->getUri(),
                        ]);

                        return $entryPoint->getUri();
                    }
                }
            }

            // Only check organizer permission if we need to ADD a new Meet link
            if (! $isOrganizer) {
                Log::error(
                    'User is not the organizer of this event, cannot add Meet link',
                    [
                        'event_id'           => $eventId,
                        'organizer_email'    => $organizerEmail,
                        'current_user_email' => $currentUserEmail,
                    ],
                );
                throw new \Error(
                    'Only the event organizer can add Google Meet links to this event. The organizer is: ' .
                        ($organizerEmail ?? 'unknown'),
                );
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

    public function updateEvent(
        string $eventId,
        UpdateEventData $updateData,
        User $user,
    ): bool {
        try {
            Log::info('Starting updateEvent process', [
                'event_id' => $eventId,
                'data'     => $updateData->toGoogleCalendarArray(),
            ]);

            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before updating event. Refreshing...',
                );
                try {
                    $newTokenData = $this->refreshAccessToken();
                    $this->client->setAccessToken($newTokenData);
                    Log::info('Access token refreshed and set on client');
                } catch (\Exception $refreshError) {
                    Log::error(
                        'Failed to refresh access token during event update',
                        [
                            'error' => $refreshError->getMessage(),
                        ],
                    );

                    return false;
                }
            }

            $service = new \Google\Service\Calendar($this->client);

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
            if ($updateData->name !== null) {
                $existingEvent->setSummary($updateData->name);
            }

            // Update description
            $existingEvent->setDescription($updateData->description ?? '');

            // Update location
            if ($updateData->location !== null) {
                $existingEvent->setLocation($updateData->location);
            }

            // Handle link / conference removal
            if ($updateData->hasLinkUpdate) {
                if (! empty($updateData->link)) {
                    Log::info(
                        'Custom link update detected, but hangoutLink is read-only. Ignoring direct set.',
                        [
                            'link' => $updateData->link,
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
            if ($updateData->start_at !== null) {
                $startDateTime = new \Google\Service\Calendar\EventDateTime();
                $startDateTime->setDateTime($updateData->start_at->format('c'));
                $startDateTime->setTimeZone($user->timezone ?? 'UTC');
                $existingEvent->setStart($startDateTime);
            }

            // Update end time
            if ($updateData->end_at !== null) {
                $endDateTime = new \Google\Service\Calendar\EventDateTime();
                $endDateTime->setDateTime($updateData->end_at->format('c'));
                $endDateTime->setTimeZone($user->timezone ?? 'UTC');
                $existingEvent->setEnd($endDateTime);
            }

            // Update guests
            if ($updateData->guests !== null && is_array($updateData->guests)) {
                $attendees = [];

                // Always include the organizer as an accepted attendee
                $organizerEmail = $existingEvent->getOrganizer()
                    ? $existingEvent->getOrganizer()->getEmail()
                    : null;

                if ($organizerEmail) {
                    $attendees[] = [
                        'email'          => $organizerEmail,
                        'responseStatus' => 'accepted',
                    ];
                }

                // Add the new guests
                foreach ($updateData->guests as $guest) {
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

            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before deleting event. Refreshing...',
                );

                try {
                    $newTokenData = $this->refreshAccessToken();
                    $this->client->setAccessToken($newTokenData);
                    Log::info('Access token refreshed and set on client');
                } catch (\Exception $refreshError) {
                    Log::error(
                        'Failed to refresh access token during event deletion',
                        [
                            'error' => $refreshError->getMessage(),
                            'trace' => $refreshError->getTraceAsString(),
                        ],
                    );

                    return false;
                }
            }

            $service = new \Google\Service\Calendar($this->client);

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

    /**
     * Create a watch channel to receive push notifications for calendar events
     *
     * @param  string  $webhookUrl  The URL where Google will send notifications
     * @param  int  $ttl  Time-to-live in seconds (max 604800 = 7 days)
     * @param  string  $calendarId  The calendar ID to watch (default: 'primary')
     * @return array|null Channel resource with id, resourceId, and expiration
     */
    public function createWatch(
        string $webhookUrl,
        int $ttl = 604800,
        string $calendarId = 'primary',
        ?string $token = null,
    ): ?array {
        try {
            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before creating watch channel. Refreshing...',
                );
                $this->refreshAccessToken();
            }

            $service = new \Google\Service\Calendar($this->client);

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

            // Set expiration time (current time + TTL)
            $expiration = (time() + $ttl) * 1000; // Convert to milliseconds
            $channel->setExpiration($expiration);

            Log::info('Creating watch channel for Google Calendar', [
                'calendar_id' => $calendarId,
                'webhook_url' => $webhookUrl,
                'ttl'         => $ttl,
                'expiration'  => $expiration,
            ]);

            $channelResponse = $service->events->watch($calendarId, $channel);

            if (! $channelResponse) {
                Log::error('Failed to create watch channel - no response');

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
     * Stop a watch channel to stop receiving push notifications
     *
     * @param  string  $resourceId  The resourceId from the watch channel
     * @param  string  $channelId  The channel ID from the watch channel
     * @return bool True if successful, false otherwise
     */
    public function stopWatch(string $resourceId, string $channelId): bool
    {
        try {
            if ($this->client->isAccessTokenExpired()) {
                Log::info(
                    'Access token expired before stopping watch channel. Refreshing...',
                );
                $this->refreshAccessToken();
            }

            $service = new \Google\Service\Calendar($this->client);

            $channel = new \Google\Service\Calendar\Channel();
            $channel->setId($channelId);
            $channel->setResourceId($resourceId);

            Log::info('Stopping watch channel for Google Calendar', [
                'channel_id'  => $channelId,
                'resource_id' => $resourceId,
            ]);

            $service->channels->stop($channel);

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

    public function handleWebhookNotification(array $notificationData): ?array
    {
        try {
            Log::info('Processing Google Calendar webhook notification', [
                'notification_data' => $notificationData,
            ]);

            // Extract notification headers and payload
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

            // If the state is "exists", we need to sync the events
            if ($resourceState === 'exists') {
                Log::info('Calendar events changed, sync needed', [
                    'resource_id' => $resourceId,
                ]);

                // The webhook doesn't tell us which events changed, so perform delta sync
                // If provided, use previous sync token from the caller
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
                'trace'             => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    public function syncDelta(?string $syncToken = null, string $calendarId = 'primary'): array
    {
        $items         = [];
        $nextSyncToken = null;

        try {
            if ($this->client->isAccessTokenExpired()) {
                $this->refreshAccessToken();
            }

            $service = new \Google\Service\Calendar($this->client);

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
                $results = $service->events->listEvents($calendarId, $params);

                foreach ($results->getItems() as $event) {
                    $originalStartTime = $event->getOriginalStartTime();
                    $items[] = [
                        'id'          => $event->getId(),
                        'status'      => $event->getStatus(), // confirmed, cancelled
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
                        'attendees'            => array_map(
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
        } catch (\Exception $e) {
            Log::error('Delta sync failed', [
                'error' => $e->getMessage(),
            ]);

            return ['items' => [], 'nextSyncToken' => $nextSyncToken];
        }
    }
}
