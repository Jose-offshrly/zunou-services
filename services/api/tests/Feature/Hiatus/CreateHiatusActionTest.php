<?php

namespace Feature\Hiatus;

use App\Actions\Hiatus\CreateHiatusAction;
use App\DataTransferObjects\HiatusData;
use App\Models\Hiatus;
use App\Models\Timesheet;
use App\Models\User;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CreateHiatusActionTest extends TestCase
{
    public function test_it_can_create_a_hiatus_resource()
    {
        $this->travelTo(Carbon::parse('March 3, 2025 08:00:00'));

        $user      = User::factory()->create();
        $timesheet = Timesheet::first();

        $data = new HiatusData(
            user_id: $user->id,
            timesheet_id: $timesheet->id,
        );

        $action = app(CreateHiatusAction::class);

        $hiatus = $action->handle($data);

        $this->assertInstanceOf(Hiatus::class, $hiatus);
    }
}
