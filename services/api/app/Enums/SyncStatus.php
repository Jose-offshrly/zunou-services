<?php

namespace App\Enums;

enum SyncStatus: string
{
    case IN_PROGRESS = 'IN_PROGRESS';
    case DONE        = 'DONE';
    case FAILED      = 'FAILED';
}
