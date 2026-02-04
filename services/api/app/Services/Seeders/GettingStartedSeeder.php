<?php

namespace App\Services\Seeders;

use App\Models\GettingStarted;
use App\Models\Pulse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

class GettingStartedSeeder
{
    /**
     * Seed GettingStarted data for a new account.
     *
     * @param int $organizationId
     * @param string $pulseId
     * @return void
     */
    public function seedGettingStartedData($organizationId, $pulseId)
    {
        // Retrieve the pulse type for dynamic path generation
        $pulse       = Pulse::findOrFail($pulseId);
        $environment = App::environment() ?: 'production';
        $filePath    = base_path(
            "data-seeds/{$environment}/{$pulse->type}/getting_started_items.json",
        );

        if (! file_exists($filePath)) {
            Log::error("GettingStarted seed file not found: {$filePath}");
            return;
        }

        $seedData = json_decode(file_get_contents($filePath), true);

        if (! $seedData) {
            Log::error(
                "Invalid JSON data in GettingStarted seed file: {$filePath}",
            );
            return;
        }

        foreach ($seedData as $data) {
            GettingStarted::create([
                'organization_id' => $organizationId,
                'pulse_id'        => $pulseId,
                'question'        => $data['question'],
                'status'          => 'pending',
            ]);
        }

        Log::info(
            "Seeded GettingStarted data for organization: $organizationId and pulse: $pulseId",
        );
    }
}
