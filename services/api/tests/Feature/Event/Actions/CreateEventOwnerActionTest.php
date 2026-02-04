<?php

namespace Feature\Event\Actions;

use App\Actions\Event\CreateEventOwnerAction;
use App\Models\Event;
use App\Models\EventOwner;
use App\Models\Pulse;
use App\Models\User;
use Tests\TestCase;

class CreateEventOwnerActionTest extends TestCase
{
    public function test_it_can_add_a_user_as_owner_to_events(): void
    {
        $event = Event::factory()->create();
        $user  = User::factory()->create();

        $action = app(CreateEventOwnerAction::class);

        $eventOwner = $action->handle(
            event: $event,
            eventable: $user,
        );

        $this->assertInstanceOf(EventOwner::class, $eventOwner);
        $this->assertInstanceOf(User::class, $eventOwner->entity);
    }


    public function test_it_can_add_a_pulse_as_owner_to_events(): void
    {
        $event = Event::factory()->create();
        $pulse = Pulse::factory()->create();

        $action = app(CreateEventOwnerAction::class);

        $eventOwner = $action->handle(
            event: $event,
            eventable: $pulse,
        );

        $this->assertInstanceOf(EventOwner::class, $eventOwner);
        $this->assertInstanceOf(Pulse::class, $eventOwner->entity);
    }

}
