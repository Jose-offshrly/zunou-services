<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all pulse statuses from INACTIVE to ACTIVE
        DB::table('pulses')
            ->where('status', 'INACTIVE')
            ->update(['status' => 'ACTIVE']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback: Update all pulse statuses from ACTIVE to INACTIVE
        DB::table('pulses')
            ->where('status', 'ACTIVE')
            ->update(['status' => 'INACTIVE']);
    }
};
