<?php

namespace App\Enums;

enum UserPresence: string
{
    case active  = 'active';
    case busy    = 'busy';
    case offline = 'offline';
    case hiatus  = 'hiatus';
}
