<?php

declare(strict_types=1);

namespace App\Enums;

enum EventSourceType: string
{
    case GOOGLE_CALENDAR = 'google_calendar';
    case OUTLOOK         = 'outlook';
    case MANUAL          = 'manual';
}
