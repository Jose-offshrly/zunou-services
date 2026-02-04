<?php

namespace App\GraphQL\Mutations;

use App\Enums\MessageStatus;
use App\Events\AiResponseComplete;
use App\Models\Message;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Log;

final readonly class CreateKestraMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = User::findOrFail($args['userId']);
        if (! $user) {
            throw new Error('No user was found');
        }

        $payload = [
            'content'         => $args['message'],
            'organization_id' => $args['organizationId'],
            'role'            => 'kestra',
            'thread_id'       => $args['threadId'],
            'user_id'         => $user->id,
            'is_system'       => true,
            'status'          => MessageStatus::COMPLETE->value,
        ];

        Log::info(
            'Kestra message payload: ' .
                implode(separator: ',', array: $payload),
        );

        $message = Message::create($payload);

        AiResponseComplete::dispatch($message); // channel: thread.{id}, temporary public channel for testing    }

        return $message->refresh();
    }
}
