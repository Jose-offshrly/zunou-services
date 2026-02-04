<?php

namespace App\Jobs;

use App\Models\LiveUpload;
use App\Models\Message;
use Aws\S3\S3Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

class ProcessLiveUploadJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $liveUploadId;

    /**
     * Create a new job instance.
     */
    public function __construct($liveUploadId)
    {
        $this->liveUploadId = $liveUploadId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('ProcessLiveUploadJob: handle event: ' . $this->liveUploadId);

        try {
            $liveUpload = LiveUpload::findOrFail($this->liveUploadId);

            if ($liveUpload->status !== 'UPLOADED') {
                throw new \Exception('Live upload status is not UPLOADED.');
            }

            $fileKey = $liveUpload->file_key;
            $bucket  = Config::get('zunou.s3.liveUploads');
            Log::info('bucket', [$bucket]);
            Log::info(
                'ProcessLiveUploadJob: loading file from S3: ' . $fileKey,
            );

            $s3Client = new S3Client([
                'version'     => 'latest',
                'region'      => Config::get('zunou.aws.region'),
                'credentials' => [
                    'key'    => Config::get('zunou.aws.key'),
                    'secret' => Config::get('zunou.aws.secret'),
                ],
            ]);

            // Get the file content from S3
            $fileBody = $s3Client->getObject([
                'Bucket' => $bucket,
                'Key'    => $fileKey,
            ])['Body'];

            $fullContent = $fileBody->__toString();

            // Update the full_content field
            $liveUpload->full_content = $fullContent;

            // Generate a summary using OpenAI
            $summary = $this->generateSummary($fullContent);

            // Update the summary_content field
            $liveUpload->summary_content = $summary;

            // Save the updated LiveUpload record
            $liveUpload->status = 'PROCESSED';
            $liveUpload->save();

            // Create a new message record
            $this->createUploadMessage($liveUpload);

            Log::info('ProcessLiveUploadJob: file processed successfully.');
        } catch (\Exception $e) {
            Log::error('ProcessLiveUploadJob: error: ' . $e->getMessage());
            Log::error(
                'ProcessLiveUploadJob: error: ' . $e->getTraceAsString(),
            );

            $liveUpload         = LiveUpload::findOrFail($this->liveUploadId);
            $liveUpload->status = 'FAILED';
            $liveUpload->save();
        }
    }

    protected function generateSummary($content)
    {
        $openAI = \OpenAI::client(Config::get('zunou.openai.api_key'));

        $response = $openAI->chat()->create([
            'model'    => Config::get('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'Summarize the following content.',
                ],
                ['role' => 'user', 'content' => $content],
            ],
        ]);

        $summary = $response['choices'][0]['message']['content'];

        return $summary;
    }

    protected function createUploadMessage(LiveUpload $liveUpload)
    {
        $message = new Message([
            'content'         => 'File was uploaded: ' . $liveUpload->id,
            'organization_id' => $liveUpload->organization_id,
            'role'            => 'user',
            'thread_id'       => $liveUpload->thread_id,
            'user_id'         => $liveUpload->user_id,
            'is_system'       => false,
        ]);

        $message->save();

        Log::info(
            'ProcessLiveUploadJob: Message created with ID ' . $message->id,
        );
    }
}
