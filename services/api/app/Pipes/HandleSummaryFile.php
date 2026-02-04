<?php

namespace App\Pipes;

use Closure;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HandleSummaryFile
{
    public function handle(array $payload, Closure $next)
    {
        extract($payload);

        if (! isset($data->transcript) && isset($data->fileData)) {
            Log::info(
                'HandleSummaryFile >>> fileData:',
                (array) $data->fileData,
            );

            if (! isset($data->fileData->file_key, $data->fileData->file_name)) {
                Log::warning(
                    'HandleSummaryFile >>> Missing file_key or file_name in fileData',
                );

                return $next($payload);
            }

            try {
                Log::info('HandleSummaryFile >>> fetching raw summary text');
                $summaryRawText = Storage::disk('s3')->get(
                    $data->fileData->file_key,
                );
            } catch (\Throwable $e) {
                Log::error(
                    'HandleSummaryFile >>> Failed to fetch file from S3',
                    [
                        'key'   => $data->fileData->file_key,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ],
                );

                return $next($payload); // Allow continuation or throw $e if it's critical
            }

            Log::info(
                'HandleSummaryFile >>> raw summary text: ' . $summaryRawText,
            );
            Log::info('HandleSummaryFile >>> updating dataSource metadata');

            $job->updateDataSourceMetaData(
                dataSource: $dataSource,
                s3Path: $data->fileData->file_key,
                fileName: $data->fileData->file_name,
            );

            Log::info('HandleSummaryFile >>> generating dataSource summary');

            $job->generateDataSourceSummary(
                dataSource: $dataSource,
                summaryRawText: $summaryRawText,
            );

            if (isset($dataSource->metadata['fileKey'])) {
                $dataSource->is_viewable = true;
                $dataSource->save();
            }

            $data->transcript = $summaryRawText;

            Log::info('HandleSummaryFile >>> creating transcript record');

            $job->createTranscript(
                content: $job->generateTranscript(data: $data),
                meeting_id: $meeting->id,
                data_source_id: $dataSource->id,
            );
        }

        return $next($payload);
    }
}
