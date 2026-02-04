<?php

namespace App\Enums;

enum OrganizationUserStatus: string
{
    case Active  = 'ACTIVE';
    case Invited = 'INVITED';
}
