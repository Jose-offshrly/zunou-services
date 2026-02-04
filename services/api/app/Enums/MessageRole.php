<?php

namespace App\Enums;

enum MessageRole: string
{
    case assistant = 'assistant';
    case tool      = 'tool';
    case user      = 'user';
    case kestra    = 'kestra';
}
