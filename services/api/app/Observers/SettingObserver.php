<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Setting;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Observer for Setting model to handle cache invalidation.
 */
class SettingObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the Setting "created" event.
     */
    public function created(Setting $setting): void
    {
        $this->clearSettingCaches($setting);
    }

    /**
     * Handle the Setting "updated" event.
     */
    public function updated(Setting $setting): void
    {
        $this->clearSettingCaches($setting);
    }

    /**
     * Handle the Setting "deleted" event.
     */
    public function deleted(Setting $setting): void
    {
        $this->clearSettingCaches($setting);
    }

    private function clearSettingCaches(Setting $setting): void
    {
        Cache::forget("settings:user:{$setting->user_id}:org:{$setting->organization_id}");
        CacheService::clearLighthouseCache('Setting', (string) $setting->id);

        Log::debug('SettingObserver: cleared caches', ['setting_id' => $setting->id]);
    }
}
