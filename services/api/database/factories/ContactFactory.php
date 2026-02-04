<?php

namespace Database\Factories;

use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class ContactFactory extends Factory
{
    protected $model = Contact::class;

    public function definition(): array
    {
        return [
            'name'                 => $this->faker->name(),
            'email'                => $this->faker->unique()->safeEmail(),
            'alt_email'            => $this->faker->unique()->safeEmail(),
            'telephone_number'     => $this->faker->word(),
            'alt_telephone_number' => $this->faker->word(),
            'settings'             => $this->faker->words(),
            'details'              => $this->faker->word(),
            'created_at'           => Carbon::now(),
            'updated_at'           => Carbon::now(),
        ];
    }
}
