<?php

namespace App\Actions\Hiatus;

use App\Models\Hiatus;
use Illuminate\Support\Carbon;

class CalculateHiatusTotalTimeAction
{
    public function handle(Hiatus $hiatus, Carbon $end): string
    {
        return number_format(
            $hiatus->start_at->diffInSeconds($end, false) / 3600,
            2,
            '.',
            '',
        );
    }
}
