<?php

// database/migrations/2025_01_01_000200_add_rec_cols_to_outbox.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->decimal('rec_score', 8, 4)->nullable()->index();   // computed by Glue
            $table->integer('rec_rank')->nullable()->index();          // 1 = highest priority
            $table->jsonb('rec_reason')->nullable();                   // compact explainability
            $table->timestampTz('recommended_at')->nullable()->index(); // last compute
            $table->boolean('suppressed')->default(false)->index();    // Glue can hide low-value rows
        });
    }

    public function down(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->dropColumn(['rec_score','rec_rank','rec_reason','recommended_at','suppressed']);
        });
    }
};
