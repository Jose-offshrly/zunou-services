<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Label;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Observer for Label model to handle cache invalidation.
 */
class LabelObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the Label "created" event.
     */
    public function created(Label $label): void
    {
        $this->clearLabelCaches($label);
    }

    /**
     * Handle the Label "updated" event.
     */
    public function updated(Label $label): void
    {
        $this->clearLabelCaches($label);
    }

    /**
     * Handle the Label "deleted" event.
     */
    public function deleted(Label $label): void
    {
        $this->clearLabelCaches($label);
    }

    private function clearLabelCaches(Label $label): void
    {
        if ($label->pulse_id) {
            Cache::forget("labels:pulse:{$label->pulse_id}");
        }

        CacheService::clearLighthouseCache('Label', $label->id);

        Log::debug('LabelObserver: cleared caches', ['label_id' => $label->id]);
    }
}
