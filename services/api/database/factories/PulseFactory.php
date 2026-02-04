<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pulse>
 */
class PulseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'organization_id' => Organization::first()->id,
            'name'            => fake()->name,
            'type'            => 'hr',
            'description'     => fake()->text,
            'features'        => [
                'Employee Onboarding',
                'Performance Management',
                'Compensation and Benefits',
                'Leave Management',
            ],
        ];
    }
}
