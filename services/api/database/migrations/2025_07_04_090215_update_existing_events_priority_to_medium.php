<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all existing events to have MEDIUM priority
        // This handles both null and empty string priorities
        DB::table('events')
            ->where(function ($query) {
                $query->whereNull('priority')
                      ->orWhere('priority', '');
            })
            ->update(['priority' => 'MEDIUM']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: This migration is not fully reversible as we don't know 
        // what the original priority values were before the update.
        // We'll set them back to null as a best guess for rollback.
        DB::table('events')
            ->where('priority', 'MEDIUM')
            ->update(['priority' => null]);
    }
};
