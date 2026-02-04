<?php

declare(strict_types=1);

namespace App\Actions\Meeting;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\Actions\DataSource\UploadDataSourceFileToS3Action;
use App\Actions\Transcript\CreateMeetingTranscriptAction;
use App\Concerns\DataSourceHandler;
use App\Concerns\TemporaryFileHandler;
use App\Concerns\TranscriptHandler;
use App\Contracts\ActionInterface;
use App\DataTransferObjects\MeetingData;
use App\Jobs\CreateEventActionablesJob;
use App\Jobs\ProcessFileDataSourceJob;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\Pulse;
use App\Services\FirefliesMeetingProcessorService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CreateMeetingAction implements ActionInterface
{
    use DataSourceHandler;
    use TemporaryFileHandler;
    use TranscriptHandler;

    public function __construct(
        private readonly CreateMeetingDataSourceAction $createMeetingDataSourceAction,
        private readonly UploadDataSourceFileToS3Action $uploadDataSourceFileToS3Action,
        private readonly FirefliesMeetingProcessorService $firefliesProcessorService,
        private readonly CreateMeetingTranscriptAction $createMeetingTranscriptAction,
    ) {
    }

    public function handle(MeetingData $data): Meeting
    {
        return DB::transaction(function () use ($data) {
            Log::info('CreateMeetingAction >>>> Creating meeting resource');

            $meeting = Meeting::create([
                'pulse_id'       => $data->pulse_id,
                'meeting_id'     => $data->meeting_session_id ?? 'manual',
                'user_id'        => $data->user_id,
                'title'          => $data->title,
                'date'           => $data->date,
                'organizer'      => $data->organizer,
                'source'         => $data->source,
                'status'         => 'added',
                'data_source_id' => $data->dataSource->id ?? null,
            ]);
            Log::info(
                'CreateMeetingAction >>>> meeting resource',
                $meeting->toArray(),
            );

            $pulse = $data->pulse;

            $dataSource = $data->dataSource;

            if (isset($data->transcript) && ! isset($data->fileData)) {
                Log::info(
                    'CreateMeetingAction >>>> uploading transcript to s3',
                );
                $this->uploadTranscriptToS3(
                    dataSource: $dataSource,
                    data: $data,
                    pulse: $pulse,
                );

                Log::info('CreateMeetingAction >>>> generating transcript');
                $this->createTranscript(
                    content: $this->generateTranscript(data: $data),
                    meeting_id: $meeting->id,
                    data_source_id: $dataSource->id,
                );
            }

            if (! isset($data->transcript) && isset($data->fileData)) {
                Log::info('CreateMeetingAction >>>> fetching raw summary text');

                $summaryRawText = Storage::disk('s3')->get(
                    $data->fileData->file_key,
                );

                Log::info(
                    'CreateMeetingAction >>>> raw summary text:' .
                        $summaryRawText,
                );

                Log::info(
                    'CreateMeetingAction >>>> updating datasrouce metadata',
                );

                $this->updateDataSourceMetaData(
                    dataSource: $dataSource,
                    s3Path: $data->fileData->file_key,
                    fileName: $data->fileData->file_name,
                );

                Log::info(
                    'CreateMeetingAction >>>> generate datasource summary',
                );

                $this->generateDataSourceSummary(
                    dataSource: $dataSource,
                    summaryRawText: $summaryRawText,
                );

                if (isset($dataSource->metadata['fileKey'])) {
                    $dataSource->is_viewable = true;
                    $dataSource->save();
                }

                $data->transcript = $summaryRawText;

                Log::info(
                    'CreateMeetingAction >>>> creating transcript record',
                );
                $this->createTranscript(
                    content: $this->generateTranscript(data: $data),
                    meeting_id: $meeting->id,
                    data_source_id: $dataSource->id,
                );
            }

            $meeting->data_source_id = $dataSource->id;
            $meeting->save();

            Log::info('[CreateMeetingAction]: trigger actionables');
            CreateEventActionablesJob::dispatch($meeting)->onQueue('default');

            ProcessFileDataSourceJob::dispatch($dataSource->id)->onQueue(
                'default',
            );

            return $meeting->refresh();
        });
    }

    private function uploadTranscriptToS3(
        DataSource $dataSource,
        MeetingData $data,
        Pulse $pulse,
    ): void {
        $transcript = $this->generateTranscript(data: $data);

        $transcriptFilePath = $this->storeTemporaryFile(
            dataSourceId: $dataSource->id,
            summaryContent: $transcript,
        );

        $s3Path = $this->uploadDataSourceFileToS3Action->handle(
            organizationId: $pulse->organization_id,
            dataSource: $dataSource,
            fileName: $transcriptFilePath->fileName,
            tempFilePath: $transcriptFilePath->tempFilePath,
        );

        $dataSource = Model::withoutEvents(function () use (
            $dataSource,
            $s3Path,
            $transcriptFilePath,
            $transcript
        ) {
            $dataSource = $this->updateDataSourceMetaData(
                dataSource: $dataSource,
                s3Path: $s3Path,
                fileName: $transcriptFilePath->fileName,
            );

            $this->generateDataSourceSummary(
                dataSource: $dataSource,
                summaryRawText: $transcript,
            );

            return $dataSource;
        });

        if (isset($dataSource->metadata['fileKey'])) {
            $dataSource->is_viewable = true;
            $dataSource->save();
        }
    }
}
