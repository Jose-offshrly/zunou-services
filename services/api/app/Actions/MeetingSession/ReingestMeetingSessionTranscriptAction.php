<?php

declare(strict_types=1);

namespace App\Actions\MeetingSession;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\DataTransferObjects\MeetingData;
use App\Facades\MeetingFacade;
use App\Models\BackupTranscript;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\MeetingSession;
use App\Models\Pulse;
use App\Models\Transcript;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

readonly class ReingestMeetingSessionTranscriptAction
{
    public function __construct(
        private CreateMeetingDataSourceAction $createMeetingDataSourceAction,
    ) {
    }

    public function handle(
        MeetingSession $meetingSession,
        Pulse $targetPulse,
    ): Meeting {
        Log::info('ReingestMeetingSessionTranscriptAction: Starting re-ingestion', [
            'meeting_session_id' => $meetingSession->id,
            'target_pulse_id'    => $targetPulse->id,
        ]);

        return DB::transaction(function () use ($meetingSession, $targetPulse) {
            $transcript = $this->getTranscriptFromMeetingSession($meetingSession);

            if (! $transcript) {
                throw new \Exception('No transcript found for meeting session');
            }

            Log::info('ReingestMeetingSessionTranscriptAction: Found transcript', [
                'transcript_length' => strlen($transcript),
            ]);

            $dataSource = $this->createDataSourceForTargetPulse(
                meetingSession: $meetingSession,
                targetPulse: $targetPulse,
            );

            BackupTranscript::create([
                'content'        => $transcript,
                'received_at'    => now(),
                'data_source_id' => $dataSource->id,
            ]);

            $attendees = isset($meetingSession->attendees)
                ? $meetingSession->attendees->pluck('user.email')->implode(',')
                : '';

            $data = new MeetingData(
                title: $meetingSession->name ?? $meetingSession->meeting_id,
                pulse_id: $targetPulse->id,
                user_id: $meetingSession->user_id,
                date: now(),
                organizer: $meetingSession->user->email,
                transcript: $transcript,
                participants: $attendees,
                source: 'companion',
                dataSource: $dataSource,
                pulse: $targetPulse,
                meeting_session_id: $meetingSession->id,
            );

            $meeting = MeetingFacade::driver('companion')->create($data);

            Log::info('ReingestMeetingSessionTranscriptAction: Successfully created meeting', [
                'meeting_id'      => $meeting->id,
                'target_pulse_id' => $targetPulse->id,
            ]);

            return $meeting;
        });
    }

    private function getTranscriptFromMeetingSession(MeetingSession $meetingSession): ?string
    {
        if ($meetingSession->internal_meeting_id) {
            $transcript = Transcript::where('meeting_id', $meetingSession->internal_meeting_id)
                ->latest()
                ->first();

            if ($transcript?->content) {
                return $transcript->content;
            }
        }

        if ($meetingSession->dataSource) {
            $transcriptByDataSource = Transcript::where('data_source_id', $meetingSession->dataSource->id)
                ->latest()
                ->first();

            if ($transcriptByDataSource?->content) {
                return $transcriptByDataSource->content;
            }

            $backupTranscript = BackupTranscript::where('data_source_id', $meetingSession->dataSource->id)
                ->orderBy('received_at', 'desc')
                ->first();

            if ($backupTranscript?->content) {
                return $backupTranscript->content;
            }
        }

        Log::warning('ReingestMeetingSessionTranscriptAction: No transcript found in transcripts or backup_transcripts', [
            'meeting_session_id'  => $meetingSession->id,
            'internal_meeting_id' => $meetingSession->internal_meeting_id,
            'data_source_id'      => $meetingSession->data_source_id ?? null,
        ]);

        return null;
    }

    private function createDataSourceForTargetPulse(
        MeetingSession $meetingSession,
        Pulse $targetPulse,
    ): DataSource {
        Log::info('ReingestMeetingSessionTranscriptAction: Creating data source for target pulse');

        $meeting = Meeting::make([
            'title'      => $meetingSession->name ?? $meetingSession->meeting_id,
            'user_id'    => $meetingSession->user_id,
            'pulse_id'   => $targetPulse->id,
            'meeting_id' => 'companion',
            'date'       => now(),
            'organizer'  => $meetingSession->user->email,
            'source'     => 'companion',
            'status'     => 'added',
        ]);

        return $this->createMeetingDataSourceAction->handle(
            meeting: $meeting,
            organizationId: $targetPulse->organization_id,
            pulseId: $targetPulse->id,
            update_meeting: false,
        );
    }
}
