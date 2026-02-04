<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('personalizations', function (Blueprint $table) {
            $table->index(
                ['user_id', 'type'],
                'personalizations_user_type_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personalizations', function (Blueprint $table) {
            $table->dropIndex('personalizations_user_type_index');
        });
    }
};
