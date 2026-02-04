<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\DataTransferObjects\UpdateEventData;
use App\Models\Event;
use App\Models\User;
use App\Services\GoogleCalendarService;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

final readonly class UpdateEventMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        try {
            $user = Auth::user();
            if (! $user) {
                throw new Error('No user was found');
            }

            $this->validateInput($args);

            $event = Event::find($args['id']);
            if (! $event) {
                throw new Error('Event not found!');
            }

            $timezone = $user->timezone ?? 'UTC';

            // Create DTO from input args
            $updateData = UpdateEventData::fromArray($args, $timezone);

            Log::info(
                'Updating event with data:',
                $updateData->toEventUpdateArray(),
            );
            Log::info('UpdateData has description update:', [
                'hasDescriptionUpdate' => $updateData->hasDescriptionUpdate,
            ]);
            Log::info('UpdateData description value:', [
                'description' => $updateData->description,
            ]);

            // Update the event with clean data
            $event->update($updateData->toEventUpdateArray());

            // If sync is explicitly requested but no updates provided, create a new DTO with current event data
            if (
                $updateData->shouldSyncWithGoogleCalendar() && ! $updateData->hasGoogleCalendarRelevantUpdates()
            ) {
                $syncData = UpdateEventData::fromArray(
                    [
                        'name'        => $event->name,
                        'summary'     => $event->summary,
                        'description' => $event->description,
                        'location'    => $event->location,
                        'start_at'    => Carbon::parse($event->start_at)->format(
                            'Y-m-d H:i:s',
                        ),
                        'end_at' => Carbon::parse($event->end_at)->format(
                            'Y-m-d H:i:s',
                        ),
                        'guests'                    => $event->guests,
                        'link'                      => $event->link,
                        'sync_with_google_calendar' => true,
                    ],
                    $timezone,
                );
            } else {
                $syncData = $updateData;
            }

            // Sync with Google Calendar if the event has a google_event_id
            $this->syncWithGoogleCalendar($event, $syncData, $user);

            // Sync attendees when guests are updated
            if (isset($args['guests'])) {
                $this->syncAttendeesFromGuests($event, $args['guests']);
            }

            return $event->fresh();
        } catch (\Exception $e) {
            throw new Error('Failed to update event: ' . $e->getMessage());
        }
    }

    private function validateInput(array &$input): void
    {
        // Handle description updates: only process when description is explicitly provided
        if (array_key_exists('description', $input)) {
            Log::info('Description in input before processing:', [
                'description' => $input['description'],
            ]);
            // Description field is present, keep as is (null, empty string, or value)
        }

        // Handle link updates: only process when link is explicitly provided
        if (array_key_exists('link', $input)) {
            Log::info('Link in input before processing:', [
                'link' => $input['link'],
            ]);
            // Link field is present, keep as is (null, empty string, or value)
        }
        Log::info('Input after validation:', $input);

        $validator = Validator::make($input, [
            'id'                        => 'required|exists:events,id',
            'name'                      => 'nullable|string|min:1|max:255',
            'start_at'                  => 'nullable|date_format:Y-m-d H:i:s',
            'end_at'                    => 'nullable|date_format:Y-m-d H:i:s',
            'location'                  => 'nullable|string|max:255',
            'priority'                  => 'nullable|string',
            'guests'                    => 'nullable|array',
            'guests.*'                  => 'string|max:255',
            'summary'                   => 'nullable|string|max:1000',
            'description'               => 'nullable|max:1000',
            'files'                     => 'nullable|array',
            'link'                      => 'nullable|active_url',
            'sync_with_google_calendar' => 'boolean',
        ]);

        if ($validator->fails()) {
            throw new Error(
                'Validation failed: ' . $validator->errors()->first(),
            );
        }
    }

    private function syncWithGoogleCalendar(
        Event $event,
        UpdateEventData $updateData,
        $user,
    ): void {
        // Only sync if explicitly requested
        if (! $updateData->shouldSyncWithGoogleCalendar()) {
            Log::info('Skipping Google Calendar sync - not requested', [
                'event_id'       => $event->id,
                'sync_requested' => $updateData->sync_with_google_calendar,
            ]);

            return;
        }

        // Only sync if the event has a google_event_id (was created from Google Calendar)
        if (! $event->google_event_id) {
            Log::info(
                'Skipping Google Calendar sync - event has no google_event_id',
                [
                    'event_id' => $event->id,
                ],
            );

            return;
        }

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

            return;
        }

        // Skip if no relevant updates for Google Calendar
        if (! $updateData->hasGoogleCalendarRelevantUpdates()) {
            Log::info(
                'Skipping Google Calendar sync - no relevant updates for Google Calendar',
                [
                    'event_id' => $event->id,
                ],
            );

            return;
        }

        try {
            $googleCalendarService = new GoogleCalendarService(
                $user->google_calendar_refresh_token,
            );

            Log::info('Attempting to sync event with Google Calendar', [
                'event_id'        => $event->id,
                'google_event_id' => $event->google_event_id,
                'sync_data'       => $updateData->toGoogleCalendarArray(),
            ]);

            $success = $googleCalendarService->updateEvent(
                $event->google_event_id,
                $updateData,
                $user,
            );

            if ($success) {
                Log::info('Successfully synced event with Google Calendar', [
                    'event_id'        => $event->id,
                    'google_event_id' => $event->google_event_id,
                ]);
            } else {
                Log::warning('Failed to sync event with Google Calendar', [
                    'event_id'        => $event->id,
                    'google_event_id' => $event->google_event_id,
                ]);
            }
        } catch (\Exception $syncError) {
            // Log the error but don't fail the entire update
            Log::error('Error during Google Calendar sync', [
                'event_id'        => $event->id,
                'google_event_id' => $event->google_event_id,
                'error'           => $syncError->getMessage(),
                'trace'           => $syncError->getTraceAsString(),
            ]);
        }
    }

    /**
     * Sync attendees based on guests that have user resources in the system
     * Note: We can't use attach/detach here because attendees is a morphMany relationship,
     * not a belongsToMany. For morphMany relationships, we use create/delete operations.
     */
    private function syncAttendeesFromGuests(Event $event, array $guests): void
    {
        // Extract emails from guests array
        $guestEmails = collect($guests)
            ->map(fn ($guest) => is_string($guest) ? $guest : (string) $guest)
            ->filter(
                fn ($guestString) => filter_var(
                    $guestString,
                    FILTER_VALIDATE_EMAIL,
                ),
            )
            ->map(fn ($email) => strtolower(trim($email)))
            ->unique()
            ->values()
            ->toArray();

        if (empty($guestEmails)) {
            // No valid emails in guests, remove all attendees
            $event->attendees()->delete();
            Log::info('No valid guest emails found, removed all attendees', [
                'event_id' => $event->id,
            ]);

            return;
        }

        // Find users that match guest emails
        $matchingUsers   = User::whereIn('email', $guestEmails)->get();
        $matchingUserIds = $matchingUsers->pluck('id')->toArray();

        // Get current attendee user IDs for this event
        $currentAttendeeUserIds = $event
            ->attendees()
            ->pluck('user_id')
            ->toArray();

        // Calculate differences for sync operation
        $userIdsToAdd    = array_diff($matchingUserIds, $currentAttendeeUserIds);
        $userIdsToRemove = array_diff(
            $currentAttendeeUserIds,
            $matchingUserIds,
        );

        // Batch create new attendees (more efficient than individual creates)
        if (! empty($userIdsToAdd)) {
            $attendeesToCreate = collect($userIdsToAdd)
                ->map(
                    fn ($userId) => [
                        'id'          => (string) Str::uuid(),
                        'user_id'     => $userId,
                        'entity_type' => Event::class,
                        'entity_id'   => $event->id,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ],
                )
                ->toArray();

            $event->attendees()->insert($attendeesToCreate);
        }

        // Batch remove attendees that are no longer in guests
        if (! empty($userIdsToRemove)) {
            $event->attendees()->whereIn('user_id', $userIdsToRemove)->delete();
        }

        Log::info('Synced attendees for event', [
            'event_id'          => $event->id,
            'guest_emails'      => $guestEmails,
            'matching_users'    => $matchingUsers->count(),
            'added_attendees'   => count($userIdsToAdd),
            'removed_attendees' => count($userIdsToRemove),
        ]);
    }
}
