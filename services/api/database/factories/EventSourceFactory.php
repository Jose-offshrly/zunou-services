<?php

namespace Database\Factories;

use App\Enums\EventSourceType;
use App\Models\EventSource;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventSource>
 */
class EventSourceFactory extends Factory
{
    protected $model = EventSource::class;

    public function definition(): array
    {
        return [
            'source'    => EventSourceType::GOOGLE_CALENDAR,
            'source_id' => 'google-' . $this->faker->uuid(),
            'user_id'   => User::factory(),
            'date'      => now(),
            'data'      => [
                'title'           => $this->faker->sentence(3),
                'description'     => $this->faker->sentence(6),
                'location'        => $this->faker->city(),
                'google_event_id' => 'evt_' . $this->faker->unique()->uuid(),
            ],
        ];
    }

    public function googleCalendar(): self
    {
        return $this->state(fn () => [
            'source'    => EventSourceType::GOOGLE_CALENDAR,
            'source_id' => 'google-' . $this->faker->uuid(),
        ]);
    }

    public function outlook(): self
    {
        return $this->state(fn () => [
            'source'    => EventSourceType::OUTLOOK,
            'source_id' => 'outlook-' . $this->faker->uuid(),
        ]);
    }

    public function manual(): self
    {
        return $this->state(fn () => [
            'source'    => EventSourceType::MANUAL,
            'source_id' => 'manual-' . $this->faker->uuid(),
        ]);
    }
}
