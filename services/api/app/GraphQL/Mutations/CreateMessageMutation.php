<?php

namespace App\GraphQL\Mutations;

use App\Enums\MessageStatus;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;

final readonly class CreateMessageMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Message
    {
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        // Admins (or M2M users) can impersonate other users.
        if (isset($args['userId']) && $user->hasPermission('admin:users')) {
            $user = User::find($args['userId']);
        }

        $thread = $this->getThread($user, $args);

        $payload = [
            'content'         => $args['message'],
            'organization_id' => $args['organizationId'],
            'role'            => 'user',
            'thread_id'       => $thread->id,
            'user_id'         => $user->id,
            'status'          => MessageStatus::COMPLETE->value,
        ];

        return Message::create($payload);
    }

    /**
     * If the thread_id is a UUID which we can use natively, find an existing thread. If
     * it is a third-party ID such as a Slack thread, create a Pulse thread for it.
     */
    private function getThread(User $user, array $args): Thread
    {
        // Decide if the thread_id is a UUID which we can use natively, or a third-party ID such as a Slack thread.
        if (
            preg_match(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                $args['threadId'],
            )
        ) {
            return Thread::where('id', $args['threadId'])->first();
        } else {
            // The thread_id is a third-party ID, and we need to find the corresponding UUID.
            $thread = Thread::where(
                'third_party_id',
                $args['threadId'],
            )->first();

            if (! $thread) {
                // Create a new thread.
                $threadPayload = [
                    'name'            => 'New Thread',
                    'organization_id' => $args['organizationId'],
                    'third_party_id'  => $args['threadId'],
                    'type'            => 'user',
                    'user_id'         => $user->id,
                ];
                $thread = Thread::create($threadPayload);
            }

            return $thread;
        }
    }
}
