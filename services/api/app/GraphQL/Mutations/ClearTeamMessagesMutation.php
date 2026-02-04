<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\TeamMessage;
use App\Models\TeamMessageRead;
use App\Models\TeamThread;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

final readonly class ClearTeamMessagesMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args): bool
    {
        $user = Auth::user();

        if (! $user->hasOrganization($args['organizationId'])) {
            return false;
        }

        $teamThreadIds = TeamThread::where(
            'organization_id',
            $args['organizationId'],
        )->pluck('id');

        if ($teamThreadIds->isEmpty()) {
            return true;
        }

        $unreadMessageIds = TeamMessage::whereIn('team_thread_id', $teamThreadIds)
            ->where('user_id', '!=', $user->id)
            ->whereDoesntHave('reads', fn ($query) => $query->where('user_id', $user->id))
            ->pluck('id');

        if ($unreadMessageIds->isEmpty()) {
            return true;
        }

        // upsert() doesn't trigger model events, so we set id/timestamps manually
        $now = now();
        $readRecords = $unreadMessageIds->map(fn ($messageId) => [
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
