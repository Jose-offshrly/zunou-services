<?php

namespace App\Enums;

enum MeetingStatus: string
{
    case pending = 'pending';
    case added   = 'added';
    case ignored = 'ignored';
}
