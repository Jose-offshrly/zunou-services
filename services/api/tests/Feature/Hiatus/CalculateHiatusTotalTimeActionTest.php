<?php

namespace Feature\Hiatus;

use App\Actions\Hiatus\CalculateHiatusTotalTimeAction;
use App\Models\Hiatus;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CalculateHiatusTotalTimeActionTest extends TestCase
{
    public function test_it_can_calculate_hiatus_total_time()
    {
        $this->travelTo(Carbon::parse('March 3, 2025 08:10:00'));

        $hiatus = Hiatus::first();
        $end    = now();

        $action = app(CalculateHiatusTotalTimeAction::class);

        $total = $action->handle($hiatus, $end);

        $this->assertEquals('0.17', $total);
    }
}
