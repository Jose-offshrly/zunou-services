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
        //
        Schema::table('topics', function (Blueprint $table) {
            $table->uuid('team_message_reference')->nullable();
            $table
                ->foreign('team_message_reference')
                ->references('id')
                ->on('team_messages');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::table('topics', function (Blueprint $table) {
            $table->dropForeign(['team_message_reference']);
            $table->dropColumn('team_message_reference');
        });
    }
};
