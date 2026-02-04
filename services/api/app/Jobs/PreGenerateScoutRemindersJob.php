<?php

namespace App\Jobs;

use App\Actions\CreateEventReminderMessageAction;
use App\Events\ScoutReminderUpdated;
use App\Models\OrganizationUser;
use App\Models\Personalization;
use App\Models\Pulse;
use App\Models\ScoutReminderResult;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PreGenerateScoutRemindersJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info(
            '[PreGenerateScoutRemindersJob] Starting pre-generation of scout reminders',
        );

        // Get all active users with their organization and pulse relationships
        $organizationUsers = OrganizationUser::with([
            'user',
            'organization',
            'organization.pulses',
        ])
            ->whereHas('user', function ($query) {
                $query->whereNotNull('timezone');
            })
            ->get();

        $processedCount = 0;
        $errorCount     = 0;

        foreach ($organizationUsers as $orgUser) {
            try {
                $user         = $orgUser->user;
                $organization = $orgUser->organization;

                // Skip if user or organization is null
                if (! $user || ! $organization) {
                    continue;
                }

                // Process each pulse for this user
                foreach ($organization->pulses as $pulse) {
                    $this->generateReminderForUserAndPulse(
                        $user,
                        $organization->id,
                        $pulse,
                        'TODAY',
                    );
                    $this->generateReminderForUserAndPulse(
                        $user,
                        $organization->id,
                        $pulse,
                        'UPCOMING',
                    );
                    $processedCount++;
                }
            } catch (\Exception $e) {
                $errorCount++;
                Log::error(
                    '[PreGenerateScoutRemindersJob] Error processing user reminders',
                    [
                        'user_id'         => $user->id                 ?? 'unknown',
                        'organization_id' => $organization->id ?? 'unknown',
                        'error'           => $e->getMessage(),
                        'trace'           => $e->getTraceAsString(),
                    ],
                );
            }
        }

        Log::info('[PreGenerateScoutRemindersJob] Completed pre-generation', [
            'processed_count' => $processedCount,
            'error_count'     => $errorCount,
        ]);
    }

    /**
     * Generate reminder for a specific user, organization, pulse, and scope.
     */
    private function generateReminderForUserAndPulse(
        User $user,
        string $organizationId,
        Pulse $pulse,
        string $scope,
    ): void {
        try {
            // Generate a unique job ID for tracking
            $jobId = Str::ulid();

            // Get user's personalization context
            $personalization = Personalization::query()
                ->where('user_id', '=', $user->id)
                ->where('type', '=', 'scout:reminders')
                ->first();

            $context = $personalization?->context;

            // Create or update the scout reminder result record
            $scoutResult = ScoutReminderResult::updateOrCreate(
                [
                    'user_id'         => $user->id,
                    'organization_id' => $organizationId,
                    'pulse_id'        => $pulse->id,
                    'scope'           => $scope,
                ],
                [
                    'job_id'        => $jobId,
                    'status'        => 'processing',
                    'context'       => $context,
                    'error_message' => null,
                ],
            );

            // Temporarily set the authenticated user for the action
            auth()->setUser($user);

            // Generate the reminder using the existing action
            $reminderResult = CreateEventReminderMessageAction::execute(
                organizationId: $organizationId,
                scope: $scope,
                pulseId: $pulse->id,
                context: $context,
            );

            // Mark as completed and store the result
            $scoutResult->markAsCompleted($reminderResult);

            // Broadcast the update via websocket
            ScoutReminderUpdated::dispatch($scoutResult);

            Log::info(
                '[PreGenerateScoutRemindersJob] Successfully generated reminder',
                [
                    'user_id'         => $user->id,
                    'organization_id' => $organizationId,
                    'pulse_id'        => $pulse->id,
                    'scope'           => $scope,
                    'job_id'          => $jobId,
                ],
            );
        } catch (\Exception $e) {
            Log::error(
                '[PreGenerateScoutRemindersJob] Error generating reminder',
                [
                    'user_id'         => $user->id,
                    'organization_id' => $organizationId,
                    'pulse_id'        => $pulse->id,
                    'scope'           => $scope,
                    'error'           => $e->getMessage(),
                    'trace'           => $e->getTraceAsString(),
                ],
            );

            // Mark as failed if the record exists
            if (isset($scoutResult)) {
                $scoutResult->markAsFailed($e->getMessage());
                ScoutReminderUpdated::dispatch($scoutResult);
            }
        } finally {
            // Clear the authenticated user
            auth()->logout();
        }
    }
}
