<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Jobs\CreateEventActionablesJob;
use App\Models\Actionable;
use App\Models\Meeting;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class RefreshEventActionablesMutation
{
    public function __invoke($_, array $args): bool
    {
        try {
            $meetingId = $args['meetingId'];
            $eventId = $args['eventId'];

            Log::info('Refreshing event actionables', [
                'meetingId' => $meetingId,
                'eventId' => $eventId,
            ]);

            return DB::transaction(function () use ($meetingId, $eventId) {
                // Find the meeting by meeting_id
                $meeting = Meeting::where('id', $meetingId)->first();

                if (!$meeting) {
                    throw new Error("Meeting with ID {$meetingId} not found");
                }

                // Verify the meeting has a data source
                if (!$meeting->data_source_id) {
                    throw new Error(
                        'Meeting does not have an associated data source'
                    );
                }

                // Verify the meeting has a transcript
                if (!$meeting->transcript) {
                    throw new Error(
                        'Meeting does not have an associated transcript'
                    );
                }

                // Delete existing actionables for the given event_id
                $deletedCount = Actionable::forEvent($eventId)->delete();

                Log::info('Deleted existing actionables', [
                    'eventId' => $eventId,
                    'deletedCount' => $deletedCount,
                ]);

                // Dispatch the job to create new actionables
                CreateEventActionablesJob::dispatch(
                    $meeting,
                    $eventId
                )->onQueue('default');

                Log::info('Dispatched CreateEventActionablesJob', [
                    'meetingId' => $meetingId,
                    'eventId' => $eventId,
                ]);

                return true;
            });
        } catch (\Exception $e) {
            Log::error('Failed to refresh event actionables', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'meetingId' => $args['meetingId'] ?? null,
                'eventId' => $args['eventId'] ?? null,
            ]);

            throw new Error(
                'Failed to refresh event actionables: ' . $e->getMessage()
            );
        }
    }
}
