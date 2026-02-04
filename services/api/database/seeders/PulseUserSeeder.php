<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PulseUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name'     => 'pulse',
            'email'    => 'pulse@zunou.ai',
            'password' => Hash::make(value: 'pulse_zunou_user'),
        ]);
    }
}
