<?php

namespace App\Enums;

enum AutomationType: string
{
    case hourly  = 'hourly';
    case daily   = 'daily';
    case weekly  = 'weekly';
    case monthly = 'monthly';
    case yearly  = 'yearly';
}
