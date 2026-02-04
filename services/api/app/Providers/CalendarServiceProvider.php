<?php

namespace App\Providers;

use App\Factories\CalendarFactory;
use Illuminate\Support\ServiceProvider;

class CalendarServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('calendar.factory', function () {
            return new CalendarFactory();
        });
    }
}

