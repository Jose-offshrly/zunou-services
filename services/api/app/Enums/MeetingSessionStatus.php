<?php

namespace App\Enums;

enum MeetingSessionStatus: string
{
    case ACTIVE   = 'ACTIVE';
    case INACTIVE = 'INACTIVE';
    case PAUSED   = 'PAUSED';
    case ENDED    = 'ENDED';
    case STOPPED  = 'STOPPED';
}
