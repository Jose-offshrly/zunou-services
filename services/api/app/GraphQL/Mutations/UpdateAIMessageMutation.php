<?php

namespace App\GraphQL\Mutations;

use App\Enums\MessageRole;
use App\Models\Message;
use Exception;

class UpdateAIMessageMutation
{
    /**
     * Handle the update AI message mutation.
     * Preserves timestamps to maintain the original AI response timing.
     *
     * @param  null  $_
     * @param  array $args
     * @return Message
     */
    public function __invoke($_, array $args): Message
    {
        $message = Message::findOrFail($args['id']);

        // Only allow updating messages with 'assistant' role
        if ($message->role !== MessageRole::assistant->value) {
            throw new Exception(
                'Only assistant messages can be updated. => ' .
                    $message->role .
                    ' equals ' .
                    MessageRole::assistant->value,
            );
        }

        // Preserve timestamps to maintain original AI response timing
        // This is intentional for AI message editing use case
        $message->timestamps = false;
        $message->update(['content' => $args['content']]);
        $message->timestamps = true;

        return $message;
    }
}
