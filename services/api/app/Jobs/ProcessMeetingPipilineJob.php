<?php

namespace App\Jobs;

use App\Actions\DataSource\CreateMeetingDataSourceAction;
use App\Actions\DataSource\UploadDataSourceFileToS3Action;
use App\Actions\Transcript\CreateMeetingTranscriptAction;
use App\Concerns\DataSourceHandler;
use App\Concerns\TemporaryFileHandler;
use App\Concerns\TranscriptHandler;
use App\DataTransferObjects\MeetingData;
use App\Models\DataSource;
use App\Models\Meeting;
use App\Models\Pulse;
use App\Services\FirefliesMeetingProcessorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Pipeline\Pipeline;

class ProcessMeetingPipilineJob implements ShouldQueue
{
    use DataSourceHandler;
    use Queueable;
    use TemporaryFileHandler;
    use TranscriptHandler;

    public function __construct(
        private MeetingData $data,
        private Meeting $meeting,
    ) {
        //
    }

    public function handle(): void
    {
        $createMeetingDataSourceAction = new CreateMeetingDataSourceAction();
        $firefliesProcessorService     = new FirefliesMeetingProcessorService();
        $createMeetingTranscriptAction = new CreateMeetingTranscriptAction();
        $this->setCreateMeetingTranscriptAction($createMeetingTranscriptAction);
        $this->setFirefliesProcessorService($firefliesProcessorService);
        $pulse = Pulse::find($this->data->pulse_id);

        $dataSource = $createMeetingDataSourceAction->handle(
            meeting: $this->meeting,
            organizationId: $pulse->organization_id,
            pulseId: $pulse->id,
        );

        app(Pipeline::class)
            ->send([
                'data'       => $this->data,
                'meeting'    => $this->meeting,
                'pulse'      => $pulse,
                'dataSource' => $dataSource,
                'job'        => $this, // for accessing methods like uploadTranscriptToS3
            ])
            ->through([
                \App\Pipes\HandleTranscriptUpload::class,
                \App\Pipes\HandleSummaryFile::class,
            ])
            ->thenReturn();

        // Dispatch ProcessFileDataSourceJob after pipeline completes
        if (isset($dataSource->metadata['fileKey'])) {
            ProcessFileDataSourceJob::dispatch($dataSource->id)->onQueue(
                'default',
            );
        }
    }

    public function uploadTranscriptToS3(
        DataSource $dataSource,
        MeetingData $data,
        Pulse $pulse,
    ): void {
        $uploadDataSourceFileToS3Action = new UploadDataSourceFileToS3Action();
        $transcript                     = $this->generateTranscript(data: $data);

        $transcriptFilePath = $this->storeTemporaryFile(
            dataSourceId: $dataSource->id,
            summaryContent: $transcript,
        );

        $s3Path = $uploadDataSourceFileToS3Action->handle(
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
