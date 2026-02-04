<?php

declare(strict_types=1);

namespace Tests\Feature\Event\Actions;

use App\Actions\Event\CreateEventInstanceAction;
use App\DataTransferObjects\Calendar\EventInstanceData;
use App\Models\Event;
use App\Models\EventInstance;
use App\Models\Pulse;
use Tests\TestCase;

class CreateEventInstanceActionTest extends TestCase
{
    private Pulse $pulse;

    private Event $event;

    protected function setUp(): void
    {
        parent::setUp();

        $this->event = Event::factory()->create();
        $this->pulse = Pulse::factory()->create();
    }

    /** @test */
    public function it_creates_an_event_instance()
    {
        $action = new CreateEventInstanceAction();
        $data   = new EventInstanceData(
            event_id: (string) $this->event->id,
            pulse_id: (string) $this->pulse->id,
            local_description: 'Test description',
            priority: 'high',
        );

        $instance = $action->handle($data);

        $this->assertInstanceOf(EventInstance::class, $instance);
        $this->assertEquals($data->event_id, $instance->event_id);
        $this->assertEquals($data->pulse_id, $instance->pulse_id);
        $this->assertEquals($data->local_description, $instance->local_description);
        $this->assertEquals($data->priority, $instance->priority);
    }

    /** @test */
    public function it_fails_with_missing_required_fields()
    {
        $this->expectException(\ArgumentCountError::class);
        // Missing all required fields
        new EventInstanceData();
    }

    /** @test */
    public function it_allows_duplicate_event_instances_for_same_event_and_pulse()
    {
        $action = new CreateEventInstanceAction();
        $data   = new EventInstanceData(
            event_id: (string) $this->event->id,
            pulse_id: (string) $this->pulse->id,
        );
        $instance1 = $action->handle($data);
        $instance2 = $action->handle($data);
        $this->assertNotEquals($instance1->id, $instance2->id);
    }

    /** @test */
    public function it_handles_null_optional_fields()
    {
        $action = new CreateEventInstanceAction();
        $data   = new EventInstanceData(
            event_id: (string) $this->event->id,
            pulse_id: (string) $this->pulse->id,
            local_description: null,
            priority: null,
        );
        $instance = $action->handle($data);
        $this->assertNull($instance->local_description);
        $this->assertNull($instance->priority);
    }
}
