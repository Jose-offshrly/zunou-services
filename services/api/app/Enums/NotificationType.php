<?php

namespace App\Enums;

enum NotificationType: string
{
    case ORGANIZATION = 'ORGANIZATION';
    case PULSE        = 'PULSES';
    case USERS        = 'USERS';
}
