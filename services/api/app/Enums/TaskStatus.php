<?php

namespace App\Enums;

enum TaskStatus: string
{
    case TODO       = 'TODO';
    case INPROGRESS = 'INPROGRESS';
    case COMPLETED  = 'COMPLETED';
    case OVERDUE    = 'OVERDUE';
}
