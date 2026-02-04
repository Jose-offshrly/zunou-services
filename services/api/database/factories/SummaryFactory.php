<?php

namespace Database\Factories;

use App\Models\DataSource;
use App\Models\Pulse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Summary>
 */
class SummaryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'data_source_id'       => DataSource::first(),
            'summary'              => 'Summary',
            'name'                 => 'Summary name',
            'pulse_id'             => Pulse::factory(),
            'date'                 => now(),
            'attendees'            => '[]',
            'potential_strategies' => '[]',
            'user_id'              => User::factory(),
        ];
    }
}
