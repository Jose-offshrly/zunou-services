<?php

namespace App\Jobs;

use App\Contracts\CalendarInterface;
use App\Facades\Calendar;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class GoogleCalendarDeltaSyncOrchestratorJob implements ShouldQueue
{
    use Dispatchable;
    use Queueable;

    protected CalendarInterface $googleCalendarService;

    public function __construct(
        public readonly User $user,
        public readonly array $organizationIds,
        public readonly ?string $pulseId = null,
    ) {
        $this->onQueue('high');
    }

    /**
     * Orchestrates Google Calendar delta sync across multiple organizations.
     * Fetches events once, updates sync token immediately, then dispatches
     * parallel jobs per org with the prefetched events.
     */
    public function handle(): void
    {
        try {
            $user                        = $this->user;
            $this->googleCalendarService = Calendar::make('google', $user);

            Log::info('Google Calendar delta sync orchestrator started', [
                'user_id'          => $user->id,
                'user_email'       => $user->email,
                'organization_ids' => $this->organizationIds,
                'pulse_id'         => $this->pulseId,
            ]);

            // Fetch events from Google Calendar ONCE
            [$syncToken, $timeMin, $timeMax] = $this->getSyncParameters($user);
            $syncResult                      = $this->fetchEventsFromGoogle(
                $user,
                $syncToken,
                $timeMin,
                $timeMax,
            );
            $events        = $syncResult['items']         ?? [];
            $nextSyncToken = $syncResult['nextSyncToken'] ?? null;

            // Update sync token immediately after fetching (the fetch "consumes" the token)
            if ($nextSyncToken) {
                $user->update(['google_calendar_sync_token' => $nextSyncToken]);
                Log::info('Updated sync token after fetching events', [
                    'user_id' => $user->id,
                ]);
            }

            Log::info('Fetched events from Google Calendar', [
                'user_id'             => $user->id,
                'events_count'        => count($events),
                'has_next_sync_token' => ! empty($nextSyncToken),
            ]);

            // Dispatch parallel jobs for each organization with prefetched events
            foreach ($this->organizationIds as $organizationId) {
                dispatch(new GoogleCalendarEventDeltaSyncJob(
                    user: $user,
                    args: [
                        'input' => [
                            'organizationId'   => $organizationId,
                            'pulseId'          => $this->pulseId,
                            'prefetchedEvents' => $events,
                            'timeMin'          => $timeMin,
                            'timeMax'          => $timeMax,
                        ],
                    ],
                ));
            }

            Log::info('Dispatched sync jobs for all organizations', [
                'user_id'            => $user->id,
                'organization_count' => count($this->organizationIds),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to orchestrate Google Calendar delta sync', [
                'user_id'          => $this->user->id ?? null,
                'organization_ids' => $this->organizationIds,
                'error'            => $e->getMessage(),
                'trace'            => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Determine sync parameters (sync token or time range).
     */
    private function getSyncParameters(User $user): array
    {
        $hasExistingEvents = \App\Models\Event::where('user_id', $user->id)
            ->whereNotNull('google_event_id')
            ->exists();

        if ($hasExistingEvents) {
            $syncToken = $user->google_calendar_sync_token;
            Log::info('Using sync token for incremental delta sync', [
                'user_id'        => $user->id,
                'has_sync_token' => ! empty($syncToken),
            ]);

            return [$syncToken, null, null];
        }

        $timeMin = Carbon::now()->format('Y-m-d');
        $timeMax = Carbon::now()->addMonths(3)->format('Y-m-d');

        Log::info(
            'No existing events found, performing full sync for 3 months',
            [
                'user_id'  => $user->id,
                'time_min' => $timeMin,
                'time_max' => $timeMax,
            ],
        );

        return [null, $timeMin, $timeMax];
    }

    /**
     * Fetch events from Google Calendar using the sync workflow.
     */
    private function fetchEventsFromGoogle(
        User $user,
        ?string $syncToken,
        ?string $timeMin,
        ?string $timeMax,
    ): array {
        $listParams = [
            'timezone' => $user->timezone ?? 'UTC',
        ];

        if ($syncToken) {
            $listParams['syncToken'] = $syncToken;
        } else {
            $listParams['timeMin'] = $timeMin;
            $listParams['timeMax'] = $timeMax;
        }

        return $this->googleCalendarService->listEvents($listParams);
    }
}
