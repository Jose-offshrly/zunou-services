<?php

namespace App\Services;

use App\Models\Attachment;
use Illuminate\Support\Facades\DB;

class AttachmentService
{
    /**
     * Create an Attachment and associate it with a related model.
     *
     * @param string $message_id
     * @param  string  $subject
     * @param  string  $body
     * @return Attachment
     */
    public function createAttachment(
        string $message_id,
        string $subject,
        string $body,
    ): Attachment {
        return DB::transaction(function () use ($message_id, $subject, $body) {
            $attachment = Attachment::create([
                'message_id' => $message_id,
                'subject'    => $subject,
                'body'       => $body,
            ]);

            return $attachment;
        });
    }
}
