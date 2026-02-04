<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Actions\CreateAiMessageAction;
use App\Enums\MessageStatus;
use App\Jobs\CreateTemporaryMessageJob;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use GraphQL\Error\Error;
use Illuminate\Support\Facades\Auth;
use Sentry\SentrySdk;
use Sentry\Tracing\TransactionContext;

final readonly class CreateCompletionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        /*
         * Set up sentry for performance monitoring
         */
        $context = new TransactionContext();
        $context->setOp('graphql.mutation');
        $context->setName('CreateCompletionMutation');
        $transaction = SentrySdk::getCurrentHub()->startTransaction($context);
        SentrySdk::getCurrentHub()->setSpan($transaction);

        try {
            $user = Auth::user();
            if (! $user) {
                throw new error('No user was found');
            }

            // Admins (or M2M users) can impersonate other users.
            if (isset($args['userId']) && $user->hasPermission('admin:users')) {
                $user = User::find($args['userId']);
            }

            $metadata = null;

            if (isset($args['metadata']) && ! empty($args['metadata'])) {
                $metadata = json_decode($args['metadata'], true);
            }

            $thread = $this->getThread($user, $args);

            $now = now();

            $payload = [
                'content'         => $args['message'],
                'organization_id' => $args['organizationId'],
                'role'            => 'user',
                'thread_id'       => $thread->id,
                'user_id'         => $user->id,
                'status'          => MessageStatus::COMPLETE,
                'topic_id'        => $args['topicId'] ?? null,
                'metadata'        => $metadata,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];

            $message = Message::create($payload);

            $ai_message = CreateAiMessageAction::execute(
                organizationId: $args['organizationId'],
                thread: $thread,
                user: $user,
                created_at: $now->copy()->addSecond(1),
                topicId: $args['topicId'] ?? null,
            );

            CreateTemporaryMessageJob::dispatch($message, $thread->pulse_id);

            return [$message->refresh(), $ai_message];
        } finally {
            $transaction->finish();
        }
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
