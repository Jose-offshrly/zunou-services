<?php

namespace App\Providers;

use App\Services\Meeting\MeetingService;
use Illuminate\Support\ServiceProvider;

class MeetingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('meeting-service', fn () => new MeetingService());
    }
}
