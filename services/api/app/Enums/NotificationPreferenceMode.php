<?php

namespace App\Enums;

enum NotificationPreferenceMode: string
{
    case all      = 'all';
    case mentions = 'mentions';
    case off      = 'off';
}
