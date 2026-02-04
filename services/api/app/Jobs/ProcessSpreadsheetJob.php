<?php

namespace App\Jobs;

use App\Events\AiResponseComplete;
use App\Models\DataSource;
use App\Models\Message;
use App\Services\Agents\Helpers\SpreadSheetHelper;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessSpreadsheetJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    protected $prompt;
    protected $dataSourceId;
    protected $userId;
    protected $orgId;
    protected $pulseId;
    protected $threadId;
    protected $messageId;

    public function __construct(
        $prompt,
        $dataSourceId,
        $userId,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ) {
        $this->prompt       = $prompt;
        $this->dataSourceId = $dataSourceId;
        $this->userId       = $userId;
        $this->orgId        = $orgId;
        $this->pulseId      = $pulseId;
        $this->threadId     = $threadId;
        $this->messageId    = $messageId;
    }

    public function handle()
    {
        try {
            $dataSource = DataSource::find($this->dataSourceId);
            if (! $dataSource) {
                throw new \Exception('Data source not found.');
            }

            // Retrieve metadata and file path
            $metadata = is_array($dataSource->metadata)
                ? $dataSource->metadata
                : json_decode($dataSource->metadata, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Failed to decode JSON metadata.');
            }

            $filePath          = $metadata['fileKey'];
            $spreadsheetHelper = new SpreadSheetHelper(
                pulseThread: $this->threadId,
            );
            $response = $spreadsheetHelper->lookupSpreadsheet(
                $this->prompt,
                $filePath,
            );

            if ($response['status'] === 'success') {
                $content = $response['content'];
                if (is_array($content)) {
                    $content = json_encode($content[0]);
                }
                // Update original message with the response
                $message          = Message::find($this->messageId);
                $message->content = "Your spreadsheet query is complete, here is the result: $content";
                $message->status  = 'COMPLETE';
                $message->save();
                // TODO: update the previous toolcall response with the result too

                AiResponseComplete::dispatch($message);
            } elseif ($response['status'] === 'failed') {
                $this->notifyFailure(
                    'Spreadsheet processing failed: ' . $response['error'],
                );
            } else {
                $this->notifyFailure(
                    'Unexpected spreadsheet processing status.',
                );
            }
        } catch (\Exception $e) {
            Log::error('Error processing spreadsheet: ' . $e->getMessage());
            $this->notifyFailure(
                'An error occurred while processing your spreadsheet request.',
            );
        }
    }

    private function notifyFailure($message)
    {
        Message::create([
            'content'         => $message,
            'organization_id' => $this->orgId,
            'role'            => 'assistant',
            'thread_id'       => $this->threadId,
            'user_id'         => $this->userId,
            'is_system'       => false,
            'status'          => 'FAILED',
        ]);
    }
}
