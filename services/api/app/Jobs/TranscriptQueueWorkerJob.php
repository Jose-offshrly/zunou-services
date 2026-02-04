<?php

namespace App\Jobs;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\DataTransferObjects\MeetingData;
use App\Enums\MeetingSessionStatus;
use App\Events\MeetingSessionEnded;
use App\Facades\MeetingFacade;
use App\Models\BackupTranscript;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\MeetingSession;
use App\Models\Pulse;
use Aws\Sqs\SqsClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TranscriptQueueWorkerJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected SqsClient $sqsClient;

    protected string $queueUrl;

    public function setSqsClientAndQueueUrl($client, $queueUrl)
    {
        $this->sqsClient = $client;
        $this->queueUrl  = $queueUrl;
    }

    public function handle()
    {
        $this->sqsClient = $this->createSqsClient();
        $this->queueUrl  = config('zunou.aws.sqs_queue_url');

        Log::info('Initializing sqs client');

        Log::info('Start listening...');

        try {
            $result = $this->sqsClient->receiveMessage([
                'QueueUrl'            => $this->queueUrl,
                'WaitTimeSeconds'     => 10,
                'MaxNumberOfMessages' => 10,
            ]);

            Log::info('Received Messages', $result['Messages'] ?? []);

            if (! empty($result['Messages'])) {
                Log::info('Sqs Messages:', $result['Messages']);
                $this->processSqsMessages($result['Messages']);
            }
        } catch (\Exception $e) {
            Log::error('Error while listening to SQS: '.$e->getMessage());
        }
    }

    protected function createSqsClient(): SqsClient
    {
        return new SqsClient([
            'version'     => 'latest',
            'region'      => config('zunou.aws.region'),
            'credentials' => [
                'key'    => config('zunou.aws.key'),
                'secret' => config('zunou.aws.secret'),
            ],
        ]);
    }

    public function processSqsMessages(array $messages): void
    {
        foreach ($messages as $message) {
            $messageBody = json_decode($message['Body'], true);

            Log::info('Received SQS message', $messageBody);

            if (
                isset($messageBody['meeting_id']) && isset($messageBody['transcription'])
            ) {
                $this->handleTranscription(
                    $messageBody['meeting_id'],
                    $messageBody['transcription'],
                );

                $this->deleteSqsMessage($message['ReceiptHandle']);
            }
        }
    }

    protected function deleteSqsMessage(string $receiptHandle): void
    {
        $this->sqsClient->deleteMessage([
            'QueueUrl'      => $this->queueUrl,
            'ReceiptHandle' => $receiptHandle,
        ]);
    }

    protected function handleTranscription(
        string $meetingId,
        string $transcript,
    ): void {
        Log::info("Transcription for meeting {$meetingId}: {$transcript}");

        DB::transaction(function () use ($meetingId, $transcript) {
            $meetingSession = MeetingSession::where('meeting_id', $meetingId)
                // @TODO: uncomment when companion can update status
                // ->where('companion_status', CompanionStatus::JOINED)
                ->lockForUpdate()
                ->firstOrFail();

            // Skip if this session is already processed
            if (
                $meetingSession->status === MeetingSessionStatus::ENDED || $meetingSession->internal_meeting_id !== null
            ) {
                Log::info("Meeting {$meetingId} already processed.");

                return;
            }

            $pulse = Pulse::find($meetingSession->pulse_id);

            Log::info('[CompanionHandler]: Create DataSource');
            $dataSource = $meetingSession->dataSource ?? $this->createDataSource(
                pulse: $pulse,
                meetingSession: $meetingSession,
            );

            $meetingSession->update([
                'data_source_id' => $dataSource->id,
            ]);

            if (isset($transcript)) {
                BackupTranscript::create([
                    'content'        => $transcript,
                    'received_at'    => now(),
                    'data_source_id' => $dataSource->id,
                ]);
            }

            $attendees = isset($meetingSession->attendees)
                ? $meetingSession->attendees->pluck('user.email')
                : [];

            $data = new MeetingData(
                title: $meetingSession->name ?? $meetingSession->meeting_id,
                pulse_id: $meetingSession->pulse_id,
                user_id: $meetingSession->user_id,
                date: now(),
                organizer: $meetingSession->user->email,
                transcript: $transcript,
                participants: $attendees,
                source: $meetingSession->meeting_id,
                dataSource: $dataSource,
                pulse: $pulse,
                meeting_session_id: $meetingSession->id,
            );

            $meeting = MeetingFacade::driver('companion')->create($data);

            $meetingSession->update([
                'internal_meeting_id' => $meeting->id,
                'status'              => MeetingSessionStatus::ENDED->value,
            ]);

            MeetingSessionEnded::dispatch($meetingSession);

            if ($meetingSession->recurring_meeting_id) {
                Log::info(
                    'Meeting session is recurring, dispatching create next meeting session job',
                );
                CreateNextMeetingSessionJob::dispatch(
                    meetingSession: $meetingSession,
                )->onQueue('default');

                Log::info('Create next meeting session job dispatched');
            } else {
                Log::info(
                    'Meeting session is not recurring, skipping create next meeting session job',
                );
            }
        });

        CheckDownscaleJob::dispatch();
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
}
