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
        Schema::table('monthly_questions', function (Blueprint $table) {
            $table->index(
                ['organization_id', 'pulse_id', 'month', 'year', 'rank'],
                'monthly_questions_org_pulse_month_year_rank_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('monthly_questions', function (Blueprint $table) {
            $table->dropIndex(
                'monthly_questions_org_pulse_month_year_rank_index'
            );
        });
    }
};
