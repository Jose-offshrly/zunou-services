<?php

namespace Database\Seeders;

use App\Models\MasterPulse;
use Illuminate\Database\Seeder;

class AddMCPPulseTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the HR Pulse
        $pulse = [
            'name'        => 'MCP Pulse',
            'type'        => 'mcp',
            'status'      => 'live',
            'description' => 'Test MCP Integrations',
            'features'    => ['MCP Integrations'],
        ];

        $mcpPulse = MasterPulse::where('name', 'MCP Pulse')->first();
        if (! $mcpPulse) {
            MasterPulse::create($pulse);
        }
    }
}
