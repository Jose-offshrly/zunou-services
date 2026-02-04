<?php

namespace App\Enums;

enum MessageStatus: string
{
    case COMPLETE = 'COMPLETE';
    case PENDING  = 'pending';
    case FAILED   = 'FAILED';
}
