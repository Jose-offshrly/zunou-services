<?php

namespace Database\Seeders;

use App\Models\MasterPulse;
use Illuminate\Database\Seeder;

class MasterPulseTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the HR Pulse
        $pulses = [
            [
                'name'        => 'HR Pulse',
                'type'        => 'hr',
                'status'      => 'live',
                'description' => 'A pulse focused on HR policies, procedures, and employee inquiries.',
                'features'    => [
                    'Employee Onboarding',
                    'Performance Management',
                    'Compensation and Benefits',
                    'Leave Management',
                ],
            ],
            [
                'name'        => 'Admin Pulse',
                'type'        => 'admin',
                'status'      => 'coming_soon',
                'description' => 'A pulse designed for administrative tasks and oversight.',
                'features'    => [
                    'User Management',
                    'Role and Permission Control',
                    'System Configuration',
                    'Audit Logging',
                ],
            ],
            [
                'name'        => 'Finance Pulse',
                'type'        => 'finance',
                'status'      => 'coming_soon',
                'description' => 'Focused on financial queries, policies, and transaction processing.',
                'features'    => [
                    'Strategy Development',
                    'Customer Management',
                    'Performance Metrics',
                    'Training Programs',
                ],
            ],
            // Add more pulses as needed
        ];

        foreach ($pulses as $pulseData) {
            MasterPulse::create($pulseData);
        }
    }
}
