<?php

namespace App\GraphQL\Mutations;

use App\Models\Message;
use App\Models\SavedMessage;
use App\Models\Thread;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

class SaveMessageMutation
{
    public function __invoke($_, array $args): SavedMessage
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        $thread  = Thread::findOrFail($args['input']['threadId']);
        $message = Message::findOrFail($args['input']['messageId']);

        $savedMessage = SavedMessage::firstOrCreate(
            [
                'message_id' => $message->id,
                'thread_id'  => $thread->id,
                'data->id'   => $message->id,
            ],
            [
                'message_id' => $message->id,
                'thread_id'  => $thread->id,
                'user_id'    => $user->id,
                'data'       => $message->refresh(),
            ],
        );

        return $savedMessage->refresh();
    }
}
