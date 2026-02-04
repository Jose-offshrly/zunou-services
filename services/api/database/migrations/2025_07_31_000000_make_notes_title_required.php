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
        DB::table('notes')
            ->whereNull('title')
            ->orWhere('title', '')
            ->update(['title' => 'Untitled Note']);

        Schema::table('notes', function (Blueprint $table) {
            $table->string('title')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->string('title')->nullable()->change();
        });
    }
}; 