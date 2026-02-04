<?php

namespace App\Enums;

enum StrategyType: string
{
    case missions    = 'missions';
    case automations = 'automations';
    case kpis        = 'kpis';
    case alerts      = 'alerts';
}
