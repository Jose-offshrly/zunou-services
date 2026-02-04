<?php

namespace App\Observers;

use App\Jobs\ZunouAiCreateOrganizationResourcesJob;
use App\Models\Organization;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Log;

class OrganizationObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the Organization "created" event.
     */
    public function created(Organization $organization): void
    {
        ZunouAiCreateOrganizationResourcesJob::dispatch(
            $organization->id,
        )->onQueue('default');
    }

    /**
     * Handle the Organization "updated" event.
     */
    public function updated(Organization $organization): void
    {
        $this->clearOrganizationCaches($organization);
    }

    /**
     * Handle the Organization "deleted" event.
     */
    public function deleted(Organization $organization): void
    {
        $this->clearOrganizationCaches($organization);
    }

    /**
     * Handle the Organization "restored" event.
     */
    public function restored(Organization $organization): void
    {
        $this->clearOrganizationCaches($organization);
    }

    /**
     * Handle the Organization "force deleted" event.
     */
    public function forceDeleted(Organization $organization): void
    {
        $this->clearOrganizationCaches($organization);
    }

    private function clearOrganizationCaches(Organization $organization): void
    {
        CacheService::clearOrganizationCaches($organization->id);
        CacheService::clearLighthouseCache('Organization', $organization->id);

        Log::debug('OrganizationObserver: cleared caches', ['organization_id' => $organization->id]);
    }
}
