<?php

namespace App\GraphQL\Mutations;

use App\Models\Attachment;
use App\Services\AttachmentService;

final readonly class CreateAttachmentMutation
{
    public function __construct(private AttachmentService $attachmentService)
    {
    }

    /**
     * Creates a new Attachment.
     *
     * @param null $_
     * @param array $args
     * @return Attachment
     */
    public function __invoke(null $_, array $args): Attachment
    {
        return $this->attachmentService->createAttachment(
            message_id: $args['input']['message_id'],
            subject: $args['input']['subject'],
            body: $args['input']['body'],
        );
    }
}
