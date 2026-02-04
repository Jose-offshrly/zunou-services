<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Restore all soft-deleted events by setting deleted_at to NULL
        DB::table('events')
            ->whereNotNull('deleted_at')
            ->update(['deleted_at' => null]);
    }
};
