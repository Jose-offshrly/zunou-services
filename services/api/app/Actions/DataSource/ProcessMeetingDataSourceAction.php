<?php

namespace App\Actions\DataSource;

use App\Actions\FireFlies\FetchFireFliesTranscriptSentencesAction;
use App\Actions\FireFlies\GenerateSummaryAction;
use App\Actions\Transcript\CreateMeetingTranscriptAction;
use App\Concerns\DataSourceHandler;
use App\DataTransferObjects\TranscriptData;
use App\Exceptions\FireFliesApiException;
use App\Jobs\CreateEventActionablesJob;
use App\Jobs\ProcessFileDataSourceJob;
use App\Models\DataSource;
use App\Models\Integration;
use App\Models\Meeting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class ProcessMeetingDataSourceAction
{
    use DataSourceHandler;

    public function __construct(
        private FetchFireFliesTranscriptSentencesAction $fetchFireFliesTranscriptSentencesAction,
        private GenerateSummaryAction $generateSummaryAction,
        private UploadDataSourceFileToS3Action $uploadDataSourceFileToS3Action,
        private CreateMeetingTranscriptAction $createMeetingTranscriptAction,
    ) {
    }

    /**
     * @throws FireFliesApiException
     */
    public function handle(
        Integration $integration,
        Meeting $meeting,
        DataSource $dataSource,
        string $organizationId,
        bool $broadcast = true,
    ): Meeting {
        return DB::transaction(function () use (
            $integration,
            $meeting,
            $dataSource,
            $organizationId,
            $broadcast
        ) {
            $transcript = $this->fetchFireFliesTranscriptSentencesAction->handle(
                integration: $integration,
                meetingId: $meeting->meeting_id,
            );

            // return the summary raw content aside the actual text file
            [
                $summaryFilePath,
                $summaryRawText,
            ] = $this->generateSummaryAction->handle(
                transcript: $transcript,
                dataSourceId: $dataSource->id,
            );

            $s3Path = $this->uploadDataSourceFileToS3Action->handle(
                organizationId: $organizationId,
                dataSource: $dataSource,
                fileName: $summaryFilePath->fileName,
                tempFilePath: $summaryFilePath->tempFilePath,
            );

            $dataSource = Model::withoutEvents(function () use (
                $dataSource,
                $s3Path,
                $summaryFilePath,
                $summaryRawText
            ) {
                $dataSource = $this->updateDataSourceMetaData(
                    dataSource: $dataSource,
                    s3Path: $s3Path,
                    fileName: $summaryFilePath->fileName,
                );

                $this->generateDataSourceSummary(
                    dataSource: $dataSource,
                    summaryRawText: $summaryRawText,
                    pulseId: $dataSource->pulse_id,
                );

                return $dataSource;
            });

            $transcriptData = new TranscriptData(
                content: $summaryRawText,
                meeting_id: $meeting->id,
                data_source_id: $dataSource->id,
            );

            $this->createMeetingTranscriptAction->handle($transcriptData);

            if (isset($dataSource->metadata['fileKey'])) {
                if ($broadcast) {
                    $dataSource->is_viewable = true;
                    $dataSource->save();
                } else {
                    Model::withoutEvents(function () use ($dataSource) {
                        $dataSource->is_viewable = true;
                        $dataSource->save();
                    });
                }

                CreateEventActionablesJob::dispatch($meeting)->onQueue(
                    'default',
                );

                // Dispatch ProcessFileDataSourceJob after meeting is processed
                ProcessFileDataSourceJob::dispatch($dataSource->id)->onQueue(
                    'default',
                );
            }

            return $meeting->fresh();
        });
    }
}
