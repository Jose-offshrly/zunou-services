<?php

declare(strict_types=1);

namespace App\Actions\MeetingSession;

use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Models\MeetingSession;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use App\Services\GoogleCalendarService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImportGoogleCalendarMeetingsAction
{
    public function __construct(
        protected GoogleCalendarService $googleCalendarService,
    ) {
    }

    public function handle(
        string $pulseId,
        string $organizationId,
        string $userId,
    ): array {
        try {
            Log::info('Starting Google Calendar meetings import', [
                'pulseId'        => $pulseId,
                'organizationId' => $organizationId,
                'userId'         => $userId,
            ]);

            $pulse        = Pulse::findOrFail($pulseId);
            $organization = Organization::findOrFail($organizationId);
            $user         = User::findOrFail($userId);

            $refreshToken                = $user->google_calendar_refresh_token;
            $this->googleCalendarService = new GoogleCalendarService(
                $refreshToken,
            );

            // If token is expired, refresh
            if ($this->googleCalendarService->isAccessTokenExpired()) {
                Log::info('Access token expired. Refreshing...', [
                    'user_id' => $user->id,
                ]);
                $newToken = $this->googleCalendarService->refreshAccessToken();

                // Save the new access token back to DB
                $user->google_calendar_access_token = $newToken['access_token'];
                $user->save();
            }

            $this->googleCalendarService->setAccessToken(
                $user->google_calendar_access_token,
            );

            $events = $this->googleCalendarService->getUpcomingEvents();
            Log::info('Fetched Google Calendar events', [
                'event_count' => count($events),
            ]);

            $importedSessions = [];

            foreach ($events as $event) {
                $meetLink = $this->findMeetLink($event);
                if (! $meetLink) {
                    Log::info('Skipping event - no Google Meet link found', [
                        'event_id' => $event['id'] ?? 'unknown',
                    ]);
                    continue;
                }

                $meetingId = (string) Str::ulid();

                $session = MeetingSession::create([
                    'meeting_id'      => strtolower($meetingId),
                    'meeting_url'     => str_replace(' ', '', $meetLink),
                    'pulse_id'        => $pulse->id,
                    'organization_id' => $organization->id,
                    'user_id'         => $user->id,
                    'status'          => MeetingSessionStatus::INACTIVE->value,
                    'type'            => MeetingSessionType::MEETING->value,
                    'name'            => $event['summary']               ?? 'No title',
                    'description'     => $event['description']    ?? '',
                    'start_at'        => $event['start']['dateTime'] ?? null,
                    'end_at'          => $event['end']['dateTime']     ?? null,
                ]);

                Log::info('Imported meeting session', [
                    'meeting_id' => $meetingId,
                ]);
                $importedSessions[] = $session;
            }

            Log::info('Completed import', [
                'imported_sessions_count' => count($importedSessions),
            ]);

            return $importedSessions;
        } catch (\Exception $e) {
            Log::error('Failed to import Google Calendar meetings', [
                'error' => $e->getMessage(),
            ]);
            throw new \Exception(
                'Failed to import Google Calendar meetings: ' . $e->getMessage(),
            );
        }
    }

    private function findMeetLink(array $event): ?string
    {
        // Check conference data for meet links
        if (isset($event['conferenceData']['entryPoints'])) {
            foreach ($event['conferenceData']['entryPoints'] as $entryPoint) {
                if ($entryPoint['entryPointType'] === 'video') {
                    return $entryPoint['uri'];
                }
            }
        }

        // Check description for meet links
        if (isset($event['description'])) {
            // Look for Google Meet links in the description
            if (
                preg_match(
                    '/https:\/\/meet\.google\.com\/[a-z-]+/',
                    $event['description'],
                    $matches,
                )
            ) {
                return $matches[0];
            }
        }

        return null;
    }
}
