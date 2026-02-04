<?php

namespace App\Enums;

enum WeekendDisplay: string
{
    case DEFAULT = 'default';
    case BLOCKED_OUT = 'blocked_out';
    case HIDDEN = 'hidden';
}
