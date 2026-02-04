<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class OrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Organization::factory()->create([
            'name'          => 'Zunou',
            'slack_team_id' => 'T05MEQXNTFW',
        ]);
    }
}
