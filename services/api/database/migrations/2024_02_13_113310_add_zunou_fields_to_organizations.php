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
        Schema::table('organizations', function (Blueprint $table) {
            $table->string('slack_team_id')->nullable();
            $table->integer('zunou_ai_staff_id')->nullable();
            $table->integer('zunou_ai_user_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('slack_team_id');
            $table->dropColumn('zunou_ai_staff_id');
            $table->dropColumn('zunou_ai_user_id');
        });
    }
};
