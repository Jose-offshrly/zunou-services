<?php

namespace App\Enums;

enum ThreadType: string
{
    case USER  = 'user';
    case ADMIN = 'admin';
    case GUEST = 'guest';
}
