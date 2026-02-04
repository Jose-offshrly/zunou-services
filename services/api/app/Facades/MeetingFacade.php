<?php

namespace App\Facades;

use App\Models\Meeting;
use App\Services\Meeting\MeetingService;
use Illuminate\Support\Facades\Facade;

/**
 * @method static MeetingService driver(string $driver)
 * @method static Meeting create(\App\DataTransferObjects\MeetingData $data)
 * @method static string getDriver()
 *
 * @see MeetingService
 */

class MeetingFacade extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'meeting-service';
    }
}
