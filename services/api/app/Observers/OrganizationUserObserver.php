<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\OrganizationUser;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Observer for OrganizationUser model to handle cache invalidation.
 */
class OrganizationUserObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the OrganizationUser "created" event.
     */
    public function created(OrganizationUser $organizationUser): void
    {
        $this->clearUserCaches($organizationUser);
        Log::debug('OrganizationUserObserver: cleared caches on create', [
            'organization_user_id' => $organizationUser->id,
            'user_id' => $organizationUser->user_id,
        ]);
    }

    /**
     * Handle the OrganizationUser "updated" event.
     */
    public function updated(OrganizationUser $organizationUser): void
    {
        $this->clearUserCaches($organizationUser);
        Log::debug('OrganizationUserObserver: cleared caches on update', [
            'organization_user_id' => $organizationUser->id,
            'user_id' => $organizationUser->user_id,
        ]);
    }

    /**
     * Handle the OrganizationUser "deleted" event.
     */
    public function deleted(OrganizationUser $organizationUser): void
    {
        $this->clearUserCaches($organizationUser);
        Log::debug('OrganizationUserObserver: cleared caches on delete', [
            'organization_user_id' => $organizationUser->id,
            'user_id' => $organizationUser->user_id,
        ]);
    }

    /**
     * Handle the OrganizationUser "restored" event.
     */
    public function restored(OrganizationUser $organizationUser): void
    {
        $this->clearUserCaches($organizationUser);
    }

    private function clearUserCaches(OrganizationUser $organizationUser): void
    {
        $userId = $organizationUser->user_id;
        $organizationId = $organizationUser->organization_id;

        Cache::forget("user:{$userId}:organization-ids");
        Cache::forget("user:{$userId}:pulse-ids");
        Cache::forget("pinned_organization_user_ids_{$userId}");

        CacheService::clearLighthouseCache('OrganizationUser', $organizationUser->id);
        CacheService::clearLighthouseCache('Organization', $organizationId);
        CacheService::clearLighthouseCache('User', $userId);

        Log::debug('OrganizationUserObserver: cleared caches', [
            'organization_user_id' => $organizationUser->id,
            'user_id' => $userId,
            'organization_id' => $organizationId,
        ]);
    }
}
