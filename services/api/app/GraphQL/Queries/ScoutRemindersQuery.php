<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Actions\CreateEventReminderMessageAction;
use App\Events\ScoutReminderUpdated;
use App\Models\Event;
use App\Models\Personalization;
use App\Models\ScoutReminderResult;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

readonly class ScoutRemindersQuery
{
    public function __invoke($rootValue, array $args): string
    {
        $input   = $args['input'];
        $userId  = Auth::id();
        $refresh = (bool) ($input['refresh'] ?? false);

        $allEventIds = array_unique(
            array_merge(
                $input['eventsFocus']    ?? [],
                $input['eventsConsider'] ?? [],
            ),
        );

        $events = Event::whereIn('id', $allEventIds)
            ->where('user_id', $userId)
            ->get();

        $contextHash = md5(
            implode(
                ',',
                array_merge(
                    [$userId],
                    $input['eventsFocus'],
                    $input['eventsConsider'],
                    [$input['dateRangeFocus']],
                    [$input['dateRangeConsider']],
                    [$input['context']],
                ),
            ),
        );

        // First, check if we have a stored result for this request (unless refresh is requested)
        $storedResult = null;
        if (! $refresh) {
            $storedResult = ScoutReminderResult::where('user_id', $userId)
                ->where('context_hash', $contextHash)
                ->where('organization_id', $input['organizationId'])
                ->where('pulse_id', $input['pulseId'])
                ->first();
        } else {
            // If refresh, delete any existing record for this context
            ScoutReminderResult::query()
                ->where('user_id', $userId)
                ->where('context_hash', $contextHash)
                ->where('organization_id', $input['organizationId'])
                ->where('pulse_id', $input['pulseId'])
                ->delete();
        }

        // If we have a completed result and it's fresh (less than 1 hour old), return it immediately
        if (
            $storedResult && $storedResult->isCompleted() && $storedResult->generated_at > now()->subHour()
        ) {
            return $storedResult->result;
        }

        // If we have a processing result and it's fresh, return processing status
        if (
            $storedResult && $storedResult->isProcessing() && $storedResult->created_at > now()->subHour()
        ) {
            return json_encode([
                'status'  => 'processing',
                'job_id'  => $storedResult->job_id,
                'message' => 'Your scout reminder is being generated. You will receive an update shortly.',
            ]);
        }

        // No stored result or failed result - or refresh requested - generate a new one in the background
        $jobId = Str::ulid();

        // Get user's personalization context
        $personalization = Personalization::query()
            ->where('user_id', '=', $userId)
            ->where('type', '=', 'scout:reminders')
            ->first();

        $context = $personalization?->context ?? ($input['context'] ?? null);

        // Create a new processing record
        $scoutResult = ScoutReminderResult::updateOrCreate(
            [
                'user_id'         => $userId,
                'organization_id' => $input['organizationId'],
                'pulse_id'        => $input['pulseId'],
                'context_hash'    => $contextHash,
            ],
            [
                'job_id'        => $jobId,
                'status'        => 'processing',
                'context'       => $context,
                'error_message' => null,
            ],
        );

        // Get the current user before dispatching (since auth context will be lost)
        $currentUser = Auth::user();

        // Dispatch the job to generate the reminder in the background
        dispatch(function () use (
            $input,
            $context,
            $scoutResult,
            $currentUser
        ) {
            try {
                $result = CreateEventReminderMessageAction::execute(
                    organizationId: $input['organizationId'],
                    pulseId: $input['pulseId'],
                    user: $currentUser,
                    eventsFocus: $input['eventsFocus'],
                    eventsConsider: $input['eventsConsider'],
                    dateRangeFocus: $input['dateRangeFocus'],
                    dateRangeConsider: $input['dateRangeConsider'],
                    context: $context,
                );

                // Mark as completed and store the result
                $scoutResult->markAsCompleted($result);

                // Broadcast the update via websocket
                ScoutReminderUpdated::dispatch($scoutResult);
            } catch (\Exception $e) {
                // Mark as failed
                $scoutResult->markAsFailed($e->getMessage());
                ScoutReminderUpdated::dispatch($scoutResult);
            }
        });

        // Return processing status
        return json_encode([
            'status'  => 'processing',
            'job_id'  => $jobId,
            'message' => 'Your scout reminder is being generated. You will receive an update shortly.',
        ]);
    }
}
