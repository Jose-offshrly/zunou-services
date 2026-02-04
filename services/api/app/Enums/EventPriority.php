<?php

namespace App\Enums;

enum EventPriority: string
{
    case LOW    = 'LOW';
    case MEDIUM = 'MEDIUM';
    case HIGH   = 'HIGH';
    case URGENT = 'URGENT';
}
