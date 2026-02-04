<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\OrganizationUser;
use App\Models\PinnedOrganizationUser;
use Illuminate\Support\Facades\Auth;

final readonly class OrganizationUserIsPinnedQuery
{
    private const CACHE_KEY = 'pinned_organization_user_ids';

    public function __invoke(OrganizationUser $organizationUser): bool
    {
        $user = Auth::user();
        if (! $user) {
            return false;
        }

        $pinnedIds = $this->getPinnedOrganizationUserIds($user->id);

        return in_array($organizationUser->id, $pinnedIds, true);
    }

    /**
     * Batch-load pinned IDs once per request to avoid N+1.
     */
    private function getPinnedOrganizationUserIds(string $userId): array
    {
        $cacheKey = self::CACHE_KEY.'_'.$userId;

        if (app()->bound($cacheKey)) {
            return app($cacheKey);
        }

        $pinnedIds = PinnedOrganizationUser::where('user_id', $userId)
            ->pluck('organization_user_id')
            ->toArray();

        app()->instance($cacheKey, $pinnedIds);

        return $pinnedIds;
    }
}

