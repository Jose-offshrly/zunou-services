<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\Attachment;

final readonly class UpdateAttachmentMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        // TODO implement the resolver
        $attachment = Attachment::findOrFail($args['input']['attachment_id']);
        $attachment->update([
            'subject' => $args['input']['subject'],
            'body'    => $args['input']['body'],
        ]);
        return $attachment->fresh();
    }
}
