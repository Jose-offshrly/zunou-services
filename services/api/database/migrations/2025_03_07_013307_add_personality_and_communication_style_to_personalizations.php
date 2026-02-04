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
        Schema::table('personalizations', function (Blueprint $table) {
            $table->text('personality')->nullable();
            $table->text('communication_style')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personalizations', function (Blueprint $table) {
            $table->dropColumn(['personality', 'communication_style']);
        });
    }
};
