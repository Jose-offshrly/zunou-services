<?php

namespace Feature\Event\Actions;

use App\Actions\Event\CreateEventSourceAction;
use App\Enums\EventSourceType;
use App\Models\EventSource;
use App\Models\User;
use Tests\TestCase;

class CreateEventSourceActionTest extends TestCase
{
    public function test_it_can_create_event_source()
    {
        $user = User::factory()->create();

        $eventSourceData = [
            'source'    => EventSourceType::GOOGLE_CALENDAR,
            'source_id' => 'google-event-123',
            'user_id'   => $user->id,
            'date'      => now(),
            'data'      => [
                'title'       => 'Test Event',
                'description' => 'Test Description',
                'location'    => 'Test Location',
            ],
        ];

        $action      = app(CreateEventSourceAction::class);
        $eventSource = $action->handle($eventSourceData);

        $this->assertInstanceOf(EventSource::class, $eventSource);
        $this->assertEquals(EventSourceType::GOOGLE_CALENDAR, $eventSource->source);
        $this->assertEquals('google-event-123', $eventSource->source_id);
        $this->assertEquals($user->id, $eventSource->user_id);
        $this->assertIsArray($eventSource->data);
        $this->assertEquals('Test Event', $eventSource->data['title']);
    }

    public function test_it_can_create_event_source_with_factory()
    {
        $eventSource = EventSource::factory()->googleCalendar()->create();

        $this->assertInstanceOf(EventSource::class, $eventSource);
        $this->assertEquals(EventSourceType::GOOGLE_CALENDAR, $eventSource->source);
        $this->assertArrayHasKey('google_event_id', $eventSource->data);
        $this->assertInstanceOf(User::class, $eventSource->user);
    }

    public function test_event_source_belongs_to_user()
    {
        $user        = User::factory()->create();
        $eventSource = EventSource::factory()->create(['user_id' => $user->id]);

        $this->assertInstanceOf(User::class, $eventSource->user);
        $this->assertEquals($user->id, $eventSource->user->id);
    }

    public function test_it_can_filter_event_sources_by_source_type()
    {
        $user = User::factory()->create();

        EventSource::factory()->googleCalendar()->create(['user_id' => $user->id]);
        EventSource::factory()->outlook()->create(['user_id' => $user->id]);
        EventSource::factory()->manual()->create(['user_id' => $user->id]);

        $googleSources  = EventSource::where('source', EventSourceType::GOOGLE_CALENDAR)->get();
        $outlookSources = EventSource::where('source', EventSourceType::OUTLOOK)->get();

        $this->assertEquals(EventSourceType::GOOGLE_CALENDAR, $googleSources->first()->source);
        $this->assertEquals(EventSourceType::OUTLOOK, $outlookSources->first()->source);
    }

    public function test_user_has_many_event_sources()
    {
        $user = User::factory()->create();
        EventSource::factory()->count(3)->create(['user_id' => $user->id]);

        $this->assertCount(3, $user->eventSources);
        $this->assertInstanceOf(EventSource::class, $user->eventSources->first());
    }
}
