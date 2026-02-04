<?php

namespace App\GraphQL\Mutations;

use App\Actions\CreateAiMessageAction;
use App\Models\Message;
use App\Models\Thread;
use GraphQL\Error\Error;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final readonly class RedoMessageMutation
{
    public function __construct(
        private CreateMessageMutation $createMessageMutation,
    ) {
    }

    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): Message
    {
        Log::info('Args:', $args);
        $user = Auth::user();
        if (! $user) {
            throw new Error('No user was found');
        }

        // Find the original message
        $originalMessage = Message::find($args['messageId']);
        if (! $originalMessage) {
            throw new Error('Message not found');
        }

        $threadId       = $originalMessage->thread_id;
        $organizationId = $originalMessage->organization_id;

        return DB::transaction(function () use (
            $originalMessage,
            $user,
            $threadId,
            $organizationId
        ) {
            $thread = Thread::findOrFail($threadId);
            $date   = Carbon::parse(
                $originalMessage->created_at,
                $user->timezone,
            )->timezone('UTC');

            Message::where('thread_id', $threadId)
                ->where('id', '!=', $originalMessage->id)
                ->where('user_id', $user->id)
                ->where('created_at', '>=', $date)
                ->delete();

            // Re-prompt AI
            CreateAiMessageAction::execute(
                organizationId: $organizationId,
                thread: $thread,
                user: $user,
            );

            return $originalMessage;
        });
    }
}
