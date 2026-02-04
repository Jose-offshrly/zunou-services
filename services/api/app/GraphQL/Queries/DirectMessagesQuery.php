<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessageThread;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\PinnedOrganizationUser;
use Illuminate\Support\Facades\Auth;

final readonly class DirectMessagesQuery
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $user = Auth::user();

        if (!$user) {
            throw new \Exception('User not found');
        }

        $organization = Organization::where('id', $args['organizationId'])
            ->whereHas('users', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->first();

        if (!$organization) {
            throw new \Exception('Organization not found');
        }

        // Get all pinned organization user IDs for this user in this organization
        $pinnedOrganizationUserIds = PinnedOrganizationUser::forUser($user->id)
            ->forOrganization($organization->id)
            ->pluck('organization_user_id')
            ->toArray();

        // Get all pinned user IDs (from organization users)
        $pinnedUserIds = OrganizationUser::whereIn(
            'id',
            $pinnedOrganizationUserIds
        )
            ->pluck('user_id')
            ->toArray();

        $directMessageThreads = DirectMessageThread::where(
            'organization_id',
            $organization->id
        )
            ->whereJsonContains('participants', $user->id)
            ->with([
                'directMessages' => function ($query) {
                    $query->latest();
                },
            ])
            ->get()
            ->sortByDesc(function ($thread) use ($user, $pinnedUserIds) {
                // Get the other participant
                $otherParticipantId = null;
                if (is_array($thread->participants)) {
                    $otherIds = array_filter(
                        $thread->participants,
                        fn($id) => $id != $user->id
                    );
                    $otherParticipantId = reset($otherIds) ?: null;
                }

                // Check if the other participant is pinned
                $isPinned =
                    $otherParticipantId &&
                    in_array($otherParticipantId, $pinnedUserIds);

                // First sort by pinned status (pinned first)
                // Then by unread count
                $unreadCount = $thread
                    ->directMessages()
                    ->where('sender_id', '!=', $user->id)
                    ->whereDoesntHave('reads', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->count();

                // Then by latest message date
                $latestMessageDate =
                    $thread->directMessages->first()?->created_at ??
                    $thread->created_at;

                // Combine all criteria for sorting: pinned first, then unread count, then date
                return [$isPinned ? 1 : 0, $unreadCount, $latestMessageDate];
            });

        return $directMessageThreads;
    }
}
