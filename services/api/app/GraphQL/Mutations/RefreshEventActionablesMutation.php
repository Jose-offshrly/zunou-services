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

            Log::info('Refreshing event actionables', [
                'meetingId' => $meetingId,
            ]);

            return DB::transaction(function () use ($meetingId) {
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

                // Delete existing actionables for the given event_instance_id
                $eventInstanceId = $meeting->meetingSession?->event_instance_id;
                if (!$eventInstanceId) {
                    throw new Error('Meeting does not have an associated event instance');
                }
                $deletedCount = Actionable::forEventInstance($eventInstanceId)->delete();

                Log::info('Deleted existing actionables', [
                    'eventInstanceId' => $eventInstanceId,
                    'deletedCount' => $deletedCount,
                ]);

                // Dispatch the job to create new actionables
                CreateEventActionablesJob::dispatch(
                    $meeting,
                )->onQueue('default');

                Log::info('Dispatched CreateEventActionablesJob', [
                    'meetingId' => $meetingId,
                    'eventInstanceId' => $eventInstanceId,
                ]);

                return true;
            });
        } catch (\Exception $e) {
            Log::error('Failed to refresh event actionables', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'meetingId' => $args['meetingId'] ?? null,
            ]);

            throw new Error(
                'Failed to refresh event actionables: ' . $e->getMessage()
            );
        }
    }
}
