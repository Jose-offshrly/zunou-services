<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set invite_pulse to false for meeting sessions that belong to a PERSONAL pulse
        DB::table('meeting_sessions')
            ->whereIn('pulse_id', function ($query) {
                $query
                    ->select('id')
                    ->from('pulses')
                    ->where('category', 'PERSONAL');
            })
            ->update(['invite_pulse' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert invite_pulse to true for the same meeting sessions
        DB::table('meeting_sessions')
            ->whereIn('pulse_id', function ($query) {
                $query
                    ->select('id')
                    ->from('pulses')
                    ->where('category', 'PERSONAL');
            })
            ->update(['invite_pulse' => true]);
    }
};
