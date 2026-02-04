<?php

namespace App\Enums;

enum AiAgentType: string
{
    case GITHUB = 'GITHUB';
    case SLACK  = 'SLACK';
    case ZUNOU  = 'ZUNOU';
    case JIRA   = 'JIRA';
}
