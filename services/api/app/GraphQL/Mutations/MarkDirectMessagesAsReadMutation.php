<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\DirectMessage;
use App\Models\DirectMessageRead;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class MarkDirectMessagesAsReadMutation
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo,
    ): bool {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        // Get all unread messages in the thread
        $unreadMessages = DirectMessage::where(
            'direct_message_thread_id',
            $args['threadId'],
        )
            ->where('sender_id', '!=', $user->id)
            ->whereDoesntHave('reads', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->get();

        // Mark each message as read
        foreach ($unreadMessages as $message) {
            DirectMessageRead::create([
                'user_id'           => $user->id,
                'direct_message_id' => $message->id,
            ]);
        }

        return true;
    }
}
