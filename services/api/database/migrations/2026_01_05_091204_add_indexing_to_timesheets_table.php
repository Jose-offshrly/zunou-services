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
        Schema::table('timesheets', function (Blueprint $table) {
            $table->index(
                ['user_id', 'checked_in_at'],
                'timesheets_user_checked_in_at_index'
            );
            $table->index(
                ['user_id', 'checked_out_at'],
                'timesheets_user_checked_out_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timesheets', function (Blueprint $table) {
            $table->dropIndex('timesheets_user_checked_out_at_index');
            $table->dropIndex('timesheets_user_checked_in_at_index');
        });
    }
};
