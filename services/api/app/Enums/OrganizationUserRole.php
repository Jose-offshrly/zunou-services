<?php

namespace App\Enums;

enum OrganizationUserRole: string
{
    case Owner = 'OWNER';
    case User  = 'USER';
    case Guest = 'GUEST';
}
