<?php

use App\Models\Pulse;
use App\Models\TeamThread;
use Illuminate\Database\Migrations\Migration;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all pulses that do not have a team thread
        Pulse::whereDoesntHave('team_thread')->chunk(100, function ($pulses) {
            foreach ($pulses as $pulse) {
                TeamThread::create([
                    'pulse_id'        => $pulse->id,
                    'organization_id' => $pulse->organization_id,
                ]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove team threads that were created for pulses that previously had none
        TeamThread::whereNotIn('pulse_id', function ($query) {
            $query
                ->select('pulse_id')
                ->from('team_threads')
                ->groupBy('pulse_id')
                ->havingRaw('count(*) > 1');
        })->delete();
    }
};
