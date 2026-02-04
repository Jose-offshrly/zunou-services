<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('pulse_members')->update(['role' => DB::raw('UPPER(role)')]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        DB::table('pulse_members')->update(['role' => DB::raw('LOWER(role)')]);
    }
};
