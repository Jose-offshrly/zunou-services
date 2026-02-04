<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Pulse;
use App\Models\Strategy;
use Illuminate\Database\Seeder;

class StrategySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organization = Organization::first();

        $pulse = Pulse::first();

        $relations = [
            'organization_id' => $organization->id,
            'pulse_id'        => $pulse->id,
        ];

        //Objectives
        Strategy::create([
            ...$relations,
            'type'        => 'missions',
            'name'        => 'Help Staff with email',
            'description' => 'To drive AI platform adoption by identifying, engaging, and closing enterprise clients while delivering value and aligning with company goals.',
        ]);

        //Kpis
        Strategy::create([
            ...$relations,
            'type'        => 'missions',
            'name'        => 'Maximising opportunities',
            'description' => 'Help drive conversion of qualified leads to sales oppurtunities, with target conversion rate of 60% or higher quarterly',
        ]);

        Strategy::create([
            ...$relations,
            'type'        => 'automations',
            'name'        => 'Keep up to date',
            'description' => 'Make sure the team is fully up to  date with new features and how to sell them.',
        ]);

        //alets
        Strategy::create([
            ...$relations,
            'type'        => 'automations',
            'name'        => 'New Product Feature',
            'description' => 'The product team has announced a new reporting  feature for Relay that you should all be familiar with.',
        ]);
    }
}
