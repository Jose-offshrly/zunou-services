<?php

namespace App\Concerns;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\Actions\MeetingSession\FetchCompanionStatusAction;
use App\Enums\MeetingSessionStatus;
use App\Enums\MeetingSessionType;
use App\Enums\PulseCategory;
use App\Enums\PulseMemberRole;
use App\Events\CollabEnded;
use App\Events\CollabToggle;
use App\Events\MeetingSessionEnded;
use App\Helpers\KeyTermsHelper;
use App\Jobs\CheckCompanionStatusJob;
use App\Jobs\CheckDownscaleJob;
use App\Jobs\CheckSchedulerScaleJob;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Models\User;
use App\Services\SchedulerScaleService;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait CompanionHandler
{
    private function startMeetingSession(
        MeetingSession $meetingSession,
    ): MeetingSession {
        // Pre-check ECS capacity before inviting the bot
        try {
            $scaleService = app(SchedulerScaleService::class);
            $status       = $scaleService->getStatus();

            if (
                isset($status['ecs']['running'], $status['meetings']['active'])
            ) {
                $running      = (int) $status['ecs']['running'];
                $active       = (int) $status['meetings']['active'];
                $maxInstances = (int) ($status['capacity']['maxInstances'] ?? 0);
                $spare        = $running - $active;

                // If at max capacity and still insufficient, abort immediately
                if (
                    $maxInstances > 0 && $running >= $maxInstances || $spare < 1
                ) {
                    Log::warning(
                        '[CompanionHandler] Max instances reached; cannot invite bot',
                        [
                            'running'      => $running,
                            'active'       => $active,
                            'maxInstances' => $maxInstances,
                            'spare'        => $spare,
                            'meeting_id'   => $meetingSession->meeting_id,
                            'meeting_sess' => $meetingSession->id,
                        ],
                    );
                    // Trigger a scale up attempt
                    $scaleService->triggerScale(
                        'up',
                        (string) config('app.env'),
                    );

                    // Clean up session since we cannot proceed
                    $meetingSession->delete();

                    throw new Error('bots all used up. please try again later');
                }
            } else {
                Log::warning(
                    '[CompanionHandler] Scheduler scale status missing expected fields; proceeding without capacity guard',
                    [
                        'status' => $status,
                    ],
                );
            }
        } catch (Error $e) {
            // On any error checking capacity, log and proceed with invite to avoid blocking
            Log::error(
                '[CompanionHandler] Error while checking ECS capacity prior to invite',
                [
                    'message' => $e->getMessage(),
                ],
            );
            throw new Error($e->getMessage());
        }

        // Get the pulse to determine if it's personal
        $pulse = $meetingSession->pulse;

        if ($pulse && $pulse->category === PulseCategory::PERSONAL) {
            $owner = $pulse
                ->members()
                ->with('user')
                ->where('role', PulseMemberRole::OWNER)
                ->first();
            $pulseName = $owner ? $owner->user->name : $pulse->name;
        } else {
            $pulseName = $pulse?->name ?? 'Unknown Pulse';
        }

        $meetingSession->loadMissing('attendees.user');
        $keyterms = $meetingSession->attendees !== null
            ? KeyTermsHelper::fromAttendees($meetingSession->attendees)
            : [];

        $payload = [
            'meeting_id'    => $meetingSession->meeting_id,
            'meetUrl'       => $meetingSession->meeting_url,
            'companionName' => $meetingSession?->organization?->name.
                ' Pulse - '.
                $pulseName,
            'keyterms'      => $keyterms,
        ];

        // Only include passcode if it is not null
        if ($meetingSession->passcode !== null) {
            $payload['passcode'] = $meetingSession->passcode;
        }
        // Only include meetingType if it is not null
        if ($meetingSession->meeting_type !== null) {
            $payload['meetingType'] = $meetingSession->meeting_type->value;
        }

        Log::info('COMPANION PAYLOAD:', $payload);
        
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(config('zunou.companion.start_meeting_url'), $payload);

        if ($response->status() !== 200) {
            Log::error('companion error: '.$response->body());
            throw new Error(
                'Failed to invite bot to meeting:',
                $response->json(),
            );
        }

        Log::info('Start companion complete:', $response->json());

        $meetingSession->update([
            'status'       => MeetingSessionStatus::ACTIVE->value,
            'invite_pulse' => true,
        ]);

        CheckCompanionStatusJob::dispatch($meetingSession, 5);
        CheckSchedulerScaleJob::dispatch();

        return $meetingSession->refresh();
    }

    private function endMeetingSession(
        MeetingSession $meetingSession,
    ): MeetingSession {
        Log::info('Ending meeting session', [
            'meeting_session_id'   => $meetingSession->id,
            'recurring_meeting_id' => $meetingSession->recurring_meeting_id ?? 'no recurring meeting id',
            'meeting_session'      => $meetingSession,
        ]);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(config('zunou.companion.stop_meeting_url'), [
            'meeting_id' => $meetingSession->meeting_id,
        ]);

        if ($response->status() !== 200) {
            Log::error('End companion error:', $response->json());
            throw new Error('Failed to stop companion');
        }

        $meetingSession->update([
            'status' => MeetingSessionStatus::STOPPED->value,
        ]);

        Log::info('Meeting session updated to stopped');

        event(new MeetingSessionEnded(meetingSession: $meetingSession));

        Log::info('Meeting session ended event dispatched');

        if ($meetingSession->type === MeetingSessionType::COLLAB) {
            User::whereIn('id', $meetingSession->attendees->pluck('user_id'))
                ->get()
                ->each(
                    fn ($user) => broadcast(
                        new CollabEnded($meetingSession, $user),
                    ),
                );
        }

        // Check if we should downscale after ending a meeting session (non-blocking)
        CheckDownscaleJob::dispatch();

        return $meetingSession->refresh();
    }

    private function pauseMeetingSession(
        MeetingSession $meetingSession,
    ): MeetingSession {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(config('zunou.companion.pause_meeting_url'), [
            'meeting_id' => $meetingSession->meeting_id,
        ]);

        if ($response->status() !== 200) {
            Log::error('Pause companion error:', $response->json());
            throw new Error('Failed to pause companion');
        }

        Log::info('Pause companion complete:', $response->json());

        $meetingSession->update([
            'status' => MeetingSessionStatus::PAUSED->value,
        ]);

        if ($meetingSession->type === MeetingSessionType::COLLAB) {
            User::whereIn('id', $meetingSession->attendees->pluck('user_id'))
                ->get()
                ->each(
                    fn ($user) => broadcast(
                        new CollabToggle($meetingSession, $user),
                    ),
                );
        }

        return $meetingSession->refresh();
    }

    private function resumeMeetingSession(
        MeetingSession $meetingSession,
    ): MeetingSession {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post(config('zunou.companion.resume_meeting_url'), [
            'meeting_id' => $meetingSession->meeting_id,
        ]);

        if ($response->status() !== 200) {
            Log::error('Resume companion error:', $response->json());
            throw new Error('Failed to resume companion');
        }

        Log::info('Resume companion complete:', $response->json());

        $meetingSession->update([
            'status' => MeetingSessionStatus::ACTIVE->value,
        ]);

        if ($meetingSession->type === MeetingSessionType::COLLAB) {
            User::whereIn('id', $meetingSession->attendees->pluck('user_id'))
                ->get()
                ->each(
                    fn ($user) => broadcast(
                        new CollabToggle($meetingSession, $user),
                    ),
                );
        }

        return $meetingSession->refresh();
    }

    public function createDataSource(
        Pulse $pulse,
        MeetingSession $meetingSession,
    ): DataSource {
        Log::info(
            '[ProcessCompanionTranscriptJob: createDataSource]: Meeting instance',
        );
        $meeting = Meeting::make([
            'title'      => $meetingSession->name ?? $meetingSession->meeting_id,
            'user_id'    => $meetingSession->user_id,
            'pulse_id'   => $meetingSession->pulse_id,
            'meeting_id' => 'companion',
            'date'       => now(),
            'organizer'  => $meetingSession->user->email,
            'source'     => 'companion',
            'status'     => 'added',
        ]);

        return (new CreateMeetingDataSourceAction())->handle(
            meeting: $meeting,
            organizationId: $pulse->organization_id,
            pulseId: $pulse->id,
            update_meeting: false,
        );
    }

    private function getValidCompanionRecording(
        MeetingSession $meetingSession,
    ): ?array {
        $maxAttempts       = 5;
        $attempt           = 0;
        $recordingResponse = null;

        while ($attempt < $maxAttempts) {
            $fetchAction       = new FetchCompanionStatusAction();
            $recordingResponse = $fetchAction->fetchRecordings();

            Log::info(
                '[CompanionHandler:getValidCompanionRecording] Raw companion status response',
                [
                    'attempt'  => $attempt,
                    'response' => $recordingResponse,
                ],
            );

            $recordings   = collect($recordingResponse['recordings'] ?? []);
            $responseItem = $recordings->firstWhere(
                'meeting_id',
                $meetingSession->meeting_id,
            );

            if (
                ! empty($responseItem) && isset($responseItem['transcription_generated']) && $responseItem['transcription_generated']
            ) {
                Log::info(
                    '[CompanionHandler:getValidCompanionRecording] Valid recording found',
                    [
                        'recording' => $responseItem,
                    ],
                );

                return $responseItem;
            }

            $attempt++;
            // Wait 2 seconds before the next attempt
            sleep(2);
        }

        Log::warning(
            '[CompanionHandler:getValidCompanionRecording] Valid companion recording not found after attempts',
            [
                'meeting_id' => $meetingSession->meeting_id,
            ],
        );

        return null;
    }
}
