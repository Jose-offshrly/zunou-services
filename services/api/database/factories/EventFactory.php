<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Organization;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('now', '+1 month');
        $endDate   = $this->faker->dateTimeBetween(
            $startDate,
            $startDate->format('Y-m-d H:i:s') . ' +2 hours',
        );

        return [
            'name'            => $this->faker->sentence(3),
            'date'            => $startDate,
            'link'            => $this->faker->url(),
            'start_at'        => $startDate,
            'end_at'          => $endDate,
            'location'        => $this->faker->address(),
            'priority'        => $this->faker->randomElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
            'summary'         => $this->faker->text(200),
            'created_at'      => Carbon::now(),
            'updated_at'      => Carbon::now(),
            'guests'          => [$this->faker->email(), $this->faker->email(), $this->faker->email()],
            'google_event_id' => $this->faker->uuid(),
            'description'     => $this->faker->text(),

            'pulse_id'        => Pulse::factory(),
            'organization_id' => Organization::find(env('TEST_ORGANIZATION')),
            'user_id'         => User::factory(),
        ];
    }

}
