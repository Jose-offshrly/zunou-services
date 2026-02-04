<?php

namespace App\Enums;

enum NotificationPreferenceScopeType: string
{
    case global = 'global';
    case pulse  = 'pulse';
    case topic  = 'topic';
}
