<?php

namespace App\Enums;

enum TaskType: string
{
    case TASK = 'TASK';
    case LIST = 'LIST';
    case MILESTONE = 'MILESTONE';
}
