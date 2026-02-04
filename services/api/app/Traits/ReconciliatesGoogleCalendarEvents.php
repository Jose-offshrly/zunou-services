<?php

namespace App\Traits;

use App\Models\Event;
use App\Models\User;
use App\Services\Calendar\GoogleCalendarService;
use Illuminate\Support\Facades\Log;

trait ReconciliatesGoogleCalendarEvents
{
    /**
     * Reconcile orphaned events - delete events from DB that no longer exist on Google Calendar.
     * Uses bulk fetch to get all Google Calendar events at once, then compares against DB.
     * Much more efficient than fetching events one by one.
     *
     * @param  User  $user  The user whose events to reconcile
     * @param  GoogleCalendarService  $calendarEventService  The calendar service instance
     * @param  \DateTimeInterface  $windowStart  Start of the sync window
     * @param  \DateTimeInterface  $windowEnd  End of the sync window
     * @param  array|null  $pulseIds  Optional array of pulse IDs to limit reconciliation scope
     * @param  array  $logContext  Additional context for logging (e.g., chunk_index)
     * @return int Number of events deleted
     */
    private function reconcileOrphanedEvents(
        User $user,
        GoogleCalendarService $calendarEventService,
        \DateTimeInterface $windowStart,
        \DateTimeInterface $windowEnd,
        ?array $pulseIds = null,
        array $logContext = []
    ): int {
        // Build query for events from DB within the sync window
        $query = Event::where('user_id', $user->id)
            ->whereNotNull('google_event_id')
            ->whereBetween('start_at', [$windowStart, $windowEnd]);

        // Optionally limit to specific pulses
        if ($pulseIds !== null && !empty($pulseIds)) {
            $query->whereIn('pulse_id', $pulseIds);
        }

        $dbEvents = $query
            ->select(['id', 'google_event_id', 'pulse_id'])
            ->get();

        if ($dbEvents->isEmpty()) {
            Log::debug(
                'No events to reconcile',
                array_merge(
                    [
                        'user_id' => $user->id,
                    ],
                    $logContext
                )
            );

            return 0;
        }

        $uniqueDbEventIds = $dbEvents
            ->pluck('google_event_id')
            ->unique()
            ->values();

        Log::info(
            'Starting orphaned events reconciliation (bulk fetch)',
            array_merge(
                [
                    'user_id' => $user->id,
                    'db_events_count' => $dbEvents->count(),
                    'unique_google_ids' => $uniqueDbEventIds->count(),
                    'window_start' => $windowStart->format('Y-m-d H:i:s'),
                    'window_end' => $windowEnd->format('Y-m-d H:i:s'),
                    'pulse_ids' => $pulseIds,
                ],
                $logContext
            )
        );

        // Bulk fetch all events from Google Calendar in the sync window (much more efficient)
        $googleEventsMap = $calendarEventService->getAllEventIdsInWindow(
            $windowStart,
            $windowEnd,
            $user->timezone ?? 'UTC'
        );

        if (empty($googleEventsMap)) {
            Log::warning(
                'Failed to fetch events from Google Calendar for reconciliation',
                array_merge(
                    [
                        'user_id' => $user->id,
                    ],
                    $logContext
                )
            );

            return 0;
        }

        Log::info(
            'Bulk fetched Google Calendar events for comparison',
            array_merge(
                [
                    'user_id' => $user->id,
                    'google_events_count' => count($googleEventsMap),
                    'db_unique_ids' => $uniqueDbEventIds->count(),
                ],
                $logContext
            )
        );

        // Find events that are in DB but not in Google (or are cancelled)
        // IMPORTANT: For recurring instances, we need to be careful - when time changes,
        // Google generates a new ID, so we shouldn't delete just because exact ID is missing.
        // We only delete recurring instances if they're explicitly cancelled.
        $eventsToDelete = [];

        // Build a set of base event IDs from Google for checking if series still exists
        $googleBaseEventIds = [];
        foreach (array_keys($googleEventsMap) as $googleId) {
            $baseId = $this->extractBaseEventId($googleId);
            $googleBaseEventIds[$baseId] = true;
        }

        foreach ($uniqueDbEventIds as $dbGoogleEventId) {
            $isRecurringInstance = str_contains($dbGoogleEventId, '_');
            $baseEventId = $this->extractBaseEventId($dbGoogleEventId);

            // Check if event exists in Google Calendar
            if (isset($googleEventsMap[$dbGoogleEventId])) {
                // Event found with exact ID
                if ($googleEventsMap[$dbGoogleEventId] === 'cancelled') {
                    // Event is explicitly cancelled in Google - mark for deletion
                    $eventsToDelete[] = $dbGoogleEventId;

                    Log::info(
                        'Event is cancelled in Google Calendar, marking for deletion',
                        [
                            'user_id' => $user->id,
                            'google_event_id' => $dbGoogleEventId,
                        ]
                    );
                }
                // else: event exists and is not cancelled, keep it
            } elseif ($isRecurringInstance) {
                // Recurring instance not found with exact ID
                // This could be because the time was changed (ID changed)
                // Only delete if the entire recurring series is gone
                if (!isset($googleBaseEventIds[$baseEventId])) {
                    // The entire recurring series is gone - safe to delete
                    $eventsToDelete[] = $dbGoogleEventId;

                    Log::info(
                        'Recurring instance series no longer exists, marking for deletion',
                        [
                            'user_id' => $user->id,
                            'google_event_id' => $dbGoogleEventId,
                            'base_event_id' => $baseEventId,
                        ]
                    );
                } else {
                    // Series still exists but this specific instance ID is gone
                    // This likely means the time was changed - don't delete, let webhook handle update
                    Log::debug(
                        'Recurring instance ID changed (likely time update), skipping deletion',
                        [
                            'user_id' => $user->id,
                            'google_event_id' => $dbGoogleEventId,
                            'base_event_id' => $baseEventId,
                        ]
                    );
                }
            } else {
                // Non-recurring event not found - safe to delete
                $eventsToDelete[] = $dbGoogleEventId;

                Log::info(
                    'Non-recurring event not found in Google Calendar, marking for deletion',
                    [
                        'user_id' => $user->id,
                        'google_event_id' => $dbGoogleEventId,
                    ]
                );
            }
        }

        // Delete orphaned events from DB
        $totalDeleted = 0;
        if (!empty($eventsToDelete)) {
            $totalDeleted = $this->deleteOrphanedEventsByGoogleIds(
                $user,
                $eventsToDelete
            );

            Log::info(
                'Reconciliation completed - orphaned events deleted',
                array_merge(
                    [
                        'user_id' => $user->id,
                        'db_events_checked' => $uniqueDbEventIds->count(),
                        'google_events_fetched' => count($googleEventsMap),
                        'orphaned_ids_found' => count($eventsToDelete),
                        'total_db_records_deleted' => $totalDeleted,
                    ],
                    $logContext
                )
            );
        } else {
            Log::info(
                'Reconciliation completed - no orphaned events found',
                array_merge(
                    [
                        'user_id' => $user->id,
                        'db_events_checked' => $uniqueDbEventIds->count(),
                        'google_events_fetched' => count($googleEventsMap),
                    ],
                    $logContext
                )
            );
        }

        return $totalDeleted;
    }

    /**
     * Delete orphaned events from DB by their Google event IDs.
     * - For recurring instances (ID contains '_'), only delete that specific instance
     * - For base events (ID without '_'), delete the base event AND all its instances
     *
     * @param  User  $user  The user whose events to delete
     * @param  array  $googleEventIds  Array of Google event IDs to delete
     * @return int Number of events deleted
     */
    private function deleteOrphanedEventsByGoogleIds(
        User $user,
        array $googleEventIds
    ): int {
        if (empty($googleEventIds)) {
            return 0;
        }

        $deleteQuery = Event::where('user_id', $user->id)->where(function (
            $query
        ) use ($googleEventIds) {
            foreach ($googleEventIds as $googleEventId) {
                $isRecurringInstance = str_contains($googleEventId, '_');

                if ($isRecurringInstance) {
                    // This is a single recurring instance - only delete this exact event
                    $query->orWhere('google_event_id', $googleEventId);
                } else {
                    // This is a base event - delete it AND all its recurring instances
                    $query
                        ->orWhere('google_event_id', $googleEventId)
                        ->orWhere(
                            'google_event_id',
                            'LIKE',
                            $googleEventId . '_%'
                        );
                }
            }
        });

        return $deleteQuery->delete();
    }

    /**
     * Extract the base event ID from a Google Calendar event ID.
     * For recurring events, the ID format is "baseId_instanceTime" (e.g., "abc123_20260121T053000Z").
     * This method extracts just the base ID.
     *
     * @param  string  $googleEventId  The Google Calendar event ID
     * @return string The base event ID
     */
    private function extractBaseEventId(string $googleEventId): string
    {
        if (str_contains($googleEventId, '_')) {
            $parts = explode('_', $googleEventId);

            return $parts[0];
        }

        return $googleEventId;
    }
}
