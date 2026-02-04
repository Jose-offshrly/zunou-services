<?php

namespace App\Enums;

enum TaskPriority: string
{
    case URGENT = 'URGENT';
    case HIGH   = 'HIGH';
    case MEDIUM = 'MEDIUM';
    case LOW    = 'LOW';
}
