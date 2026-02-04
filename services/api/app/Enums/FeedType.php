<?php

namespace App\Enums;

enum FeedType: string
{
    case TASK_CREATED      = 'TASK_CREATED';
    case TASK_UPDATED      = 'TASK_UPDATED';
    case TASK_ASSIGNED     = 'TASK_ASSIGNED';
    case DIRECTMESSAGE     = 'DIRECTMESSAGE';
    case COLLAB_STARTED    = 'COLLAB_STARTED';
    case ORGGROUP_CREATED  = 'ORGGROUP_CREATED';
    case PULSEMEMBER_ADDED = 'PULSEMEMBER_ADDED';
    case TEAMMESAGE        = 'TEAMMESAGE';
}
