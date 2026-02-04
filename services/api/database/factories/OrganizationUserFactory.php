<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrganizationUser>
 */
class OrganizationUserFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'job_title'       => 'developer',
            'department'      => 'it',
            'profile'         => 'profile',
            'organization_id' => '9d83b6d2-debe-45f0-943d-275c5ff769cf',
            'user_id'         => User::factory(),
            'role'            => 'GUEST',
        ];
    }
}
