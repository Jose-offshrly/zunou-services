<?php

namespace App\Enums;

enum PulseMemberRole: string
{
    case OWNER = 'OWNER';
    case ADMIN = 'ADMIN';
    case STAFF = 'STAFF';
    case GUEST = 'GUEST';
}
