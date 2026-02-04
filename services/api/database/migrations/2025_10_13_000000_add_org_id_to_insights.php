<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->uuid('organization_id')->nullable()->after('pulse_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('live_insight_outbox', function (Blueprint $table) {
            $table->dropColumn('organization_id');
        });
    }
};
