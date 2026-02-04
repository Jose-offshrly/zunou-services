<?php

namespace App\Enums;

enum DataSourceOrigin: string
{
    case CUSTOM    = 'custom';
    case PRESET    = 'preset';
    case MEETING   = 'meeting';
    case NOTE      = 'note';
    case ON_DEVICE = 'on_device';
}
