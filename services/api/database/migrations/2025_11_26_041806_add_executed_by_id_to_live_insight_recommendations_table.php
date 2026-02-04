<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('live_insight_recommendations', function (Blueprint $table) {
            $table->uuid('executed_by_id')->nullable()->after('is_executed');
            $table->foreign('executed_by_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_insight_recommendations', function (Blueprint $table) {
            $table->dropForeign(['executed_by_id']);
            $table->dropColumn('executed_by_id');
        });
    }
};
