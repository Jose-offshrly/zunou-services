<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->foreign('organization_id')
                  ->references('id')->on('organizations')
                  ->cascadeOnDelete(); // ON DELETE CASCADE
        });
    }

    public function down(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
        });
    }
};
