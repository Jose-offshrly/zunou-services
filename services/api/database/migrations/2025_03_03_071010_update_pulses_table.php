<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pulses', function (Blueprint $table) {
            // Add the new "summary" column
            $table->text('summary')->nullable()->after('existing_column');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pulses', function (Blueprint $table) {
            // Remove "summary" column
            $table->dropColumn('summary');
        });
    }
};
