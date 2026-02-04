<?php

namespace App\Observers;

use App\Jobs\ProcessLiveUploadJob;
use App\Models\LiveUpload;
use Illuminate\Support\Facades\Log;

class LiveUploadObserver
{
    /**
     * Handle the LiveUpload "created" event.
     */
    public function created(LiveUpload $liveUpload): void
    {
        Log::info('LiveUploadObserver: created event');
        ProcessLiveUploadJob::dispatch($liveUpload->id)->onQueue('default');
    }

    /**
     * Handle the LiveUpload "updated" event.
     */
    public function updated(LiveUpload $liveUpload): void
    {
        Log::info('LiveUploadObserver: updated event');
    }

    /**
     * Handle the LiveUpload "deleted" event.
     */
    public function deleted(LiveUpload $liveUpload): void
    {
        Log::info('LiveUploadObserver: deleted event');
    }
}
