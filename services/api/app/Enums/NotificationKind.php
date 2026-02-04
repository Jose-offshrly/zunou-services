<?php

namespace App\Enums;

enum NotificationKind: string
{
    case information    = 'information';
    case summary_option = 'summary_option';
    case survey         = 'survey';
    case chat_mention       = 'chat_mention';
    case assignee_created       = 'assignee_created';
}
