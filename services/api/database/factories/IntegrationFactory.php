<?php

namespace Database\Factories;

use App\Models\Integration;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class IntegrationFactory extends Factory
{
    protected $model = Integration::class;

    public function definition(): array
    {
        return [
            'pulse_id'    => Pulse::factory(),
            'type'        => 'fireflies',
            'api_key'     => 'api-key',
            'created_at'  => Carbon::now(),
            'updated_at'  => Carbon::now(),
            'user_id'     => User::factory(),
            'sync_status' => 'DONE',
        ];
    }
}
