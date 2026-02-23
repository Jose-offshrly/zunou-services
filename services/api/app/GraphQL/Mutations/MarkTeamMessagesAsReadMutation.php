<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TeamMessage;
use App\Models\TeamMessageRead;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Nuwave\Lighthouse\Execution\HttpGraphQLContext;
use Nuwave\Lighthouse\Execution\ResolveInfo;

final readonly class MarkTeamMessagesAsReadMutation
{
    public function __invoke(
        $rootValue,
        array $args,
        HttpGraphQLContext $context,
        ResolveInfo $resolveInfo
    ): bool {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $topicId = $args['topicId'] ?? null;

        $unreadMessageIds = TeamMessage::withTrashed()
            ->where('team_thread_id', $args['threadId'])
            ->whereDoesntHave('reads', fn($q) => $q->where('user_id', $user->id))
            ->when(
                $topicId !== null,
                fn($query) => $query->where('topic_id', $topicId),
                fn($query) => $query->whereNull('topic_id')
            )
            ->pluck('id');

        if ($unreadMessageIds->isEmpty()) {
            return true;
        }

        // upsert() doesn't trigger model events, so we set id/timestamps manually
        $now = now();
        $readRecords = $unreadMessageIds->map(fn($messageId) => [
            'id' => Str::orderedUuid()->toString(),
            'team_message_id' => $messageId,
            'user_id' => $user->id,
            'read_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        TeamMessageRead::upsert($readRecords, ['team_message_id', 'user_id'], ['read_at', 'updated_at']);

        return true;
    }
}
