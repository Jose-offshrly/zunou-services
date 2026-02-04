<?php

namespace Database\Factories;

use App\Models\Meeting;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class MeetingFactory extends Factory
{
    protected $model = Meeting::class;

    public function definition(): array
    {
        return [
            'pulse_id'    => Pulse::factory(),
            'meeting_id'  => 'meeting-id',
            'user_id'     => User::factory(),
            'title'       => 'Test Meeting',
            'is_viewable' => true,
            'date'        => Carbon::now(),
            'created_at'  => Carbon::now(),
            'updated_at'  => Carbon::now(),
            'organizer'   => $this->faker->safeEmail(),
            'timezone'    => 'UTC',
        ];
    }
}
