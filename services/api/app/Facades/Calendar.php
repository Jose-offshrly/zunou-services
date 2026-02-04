<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

class Calendar extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'calendar.factory';
    }
}
