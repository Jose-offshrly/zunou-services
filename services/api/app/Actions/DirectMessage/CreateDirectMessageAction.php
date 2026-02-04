<?php

namespace App\Actions\DirectMessage;

use App\DataTransferObjects\DirectMessageData;
use App\Events\DirectMessageSent;
use App\Models\DirectMessage;
use App\Models\DirectMessageRead;
use App\Models\DirectMessageThread;
use Illuminate\Support\Facades\Log;

class CreateDirectMessageAction
{
    public function handle(DirectMessageData $data, ?array $originalFiles = null): DirectMessage
    {
        $directMessage = DirectMessage::create([
            'direct_message_thread_id' => $data->direct_message_thread_id,
            'sender_id' => $data->sender_id,
            'content' => $data->content,
            'replied_to_message_id' => $data->replied_to_message_id,
        ]);

        // Create file attachments if provided
        if ($data->files && !empty($data->files)) {
            $this->createFileAttachments($directMessage, $data->files, $originalFiles);
        }

        if ($directMessage !== null) {
            $thread = DirectMessageThread::find(
                $data->direct_message_thread_id
            );

            // Automatically mark the message as read for the sender
            DirectMessageRead::create([
                'direct_message_id' => $directMessage->id,
                'user_id' => $data->sender_id,
            ]);

            Log::info('Direct message data before dispatch', [
                'sender_id' => $data->sender_id,
                'content' => $data->content,
                'thread_id' => $data->direct_message_thread_id,
            ]);

            DirectMessageSent::dispatch($directMessage->refresh());
        }

        return $directMessage->refresh();
    }

    /**
     * Create file attachments for the direct message
     */
    private function createFileAttachments(
        DirectMessage $directMessage,
        array $fileDataObjects,
        ?array $originalFiles = null
    ): void {
        $thread = DirectMessageThread::find(
            $directMessage->direct_message_thread_id
        );

        foreach ($fileDataObjects as $index => $fileData) {
            // Get type from original files input if available
            $type = $originalFiles[$index]['type'] ?? null;

            $directMessage->files()->create([
                'path' => $fileData->file_key,
                'file_name' => $fileData->file_name,
                'type' => $type,
                'organization_id' => $thread?->organization_id,
            ]);
        }
    }
}
