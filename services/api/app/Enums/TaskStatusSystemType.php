<?php

namespace App\Enums;

enum TaskStatusSystemType: string
{
    case START = 'start';
    case MIDDLE = 'middle';
    case END = 'end';
}
