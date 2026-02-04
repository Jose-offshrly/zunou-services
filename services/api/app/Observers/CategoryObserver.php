<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Category;
use App\Services\CacheService;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Support\Facades\Log;

class CategoryObserver implements ShouldHandleEventsAfterCommit
{
    /**
     * Handle the Category "created" event.
     */
    public function created(Category $category): void
    {
        $this->clearCategoryCaches($category);
    }

    /**
     * Handle the Category "updated" event.
     */
    public function updated(Category $category): void
    {
        $this->clearCategoryCaches($category);
    }

    /**
     * Handle the Category "deleted" event.
     */
    public function deleted(Category $category): void
    {
        $this->clearCategoryCaches($category);
    }

    private function clearCategoryCaches(Category $category): void
    {
        CacheService::clearLighthouseCache('Category', $category->id);

        Log::debug('CategoryObserver: cleared caches', ['category_id' => $category->id]);
    }
}
