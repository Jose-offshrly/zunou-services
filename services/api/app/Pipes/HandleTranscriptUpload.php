<?php

namespace App\Pipes;

use Closure;
use Illuminate\Support\Facades\Log;

class HandleTranscriptUpload
{
    public function handle(array $payload, Closure $next)
    {
        extract($payload); // creates $data, $meeting, $pulse, $dataSource, $job

        if (isset($data->transcript) && ! isset($data->fileData)) {
            Log::info('HandleTranscriptUpload >>> uploading transcript to s3');

            $job->uploadTranscriptToS3($dataSource, $data, $pulse);

            Log::info('HandleTranscriptUpload >>> generating transcript');
            $job->createTranscript(
                content: $job->generateTranscript(data: $data),
                meeting_id: $meeting->id,
                data_source_id: $dataSource->id,
            );
        }

        return $next($payload);
    }
}
