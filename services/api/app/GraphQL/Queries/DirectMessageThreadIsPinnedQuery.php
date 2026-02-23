<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\DirectMessageThread;
use App\Models\OrganizationUser;
use App\Models\PinnedOrganizationUser;
use Illuminate\Support\Facades\Auth;

/**
 * @deprecated Part of deprecated DirectMessage system.
 */
final readonly class DirectMessageThreadIsPinnedQuery
{
    public function __invoke(DirectMessageThread $thread): bool
    {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        // Get the other participant
        $otherParticipantId = null;
        if (is_array($thread->participants)) {
            $otherIds = array_filter(
                $thread->participants,
                fn ($id) => $id != $user->id,
            );
            $otherParticipantId = reset($otherIds) ?: null;
        }

        if (! $otherParticipantId) {
            return false;
        }

        // Find the organization user for the other participant
        $organizationUser = OrganizationUser::where('user_id', $otherParticipantId)
            ->where('organization_id', $thread->organization_id)
            ->first();

        if (! $organizationUser) {
            return false;
        }

        // Check if this organization user is pinned by the current user
        return PinnedOrganizationUser::where('user_id', $user->id)
            ->where('organization_user_id', $organizationUser->id)
            ->exists();
    }
}

