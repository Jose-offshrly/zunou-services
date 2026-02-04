<?php

namespace Feature\Pulse;

use App\Actions\Pulse\DeletePulseAction;
use App\Models\Pulse;
use Tests\TestCase;

class DeletePulseActionTest extends TestCase
{
    public function test_it_deletes_the_given_pulse()
    {
        //Arrange
        $pulse  = Pulse::factory()->create();
        $action = app(DeletePulseAction::class);

        //Act
        $pulseDeleted = $action->handle(pulse: $pulse);

        //Assert
        $this->assertTrue($pulseDeleted);
    }
}
