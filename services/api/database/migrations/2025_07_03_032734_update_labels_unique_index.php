<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('labels', function (Blueprint $table) {
            // Drop old unique index on name
            $table->dropUnique('labels_name_unique');

            // Add new composite unique index
            $table->unique(['name', 'pulse_id']);
        });
    }

    public function down(): void
    {
        Schema::table('labels', function (Blueprint $table) {
            $table->dropUnique(['name', 'pulse_id']);
            $table->unique('name');
        });
    }
};
