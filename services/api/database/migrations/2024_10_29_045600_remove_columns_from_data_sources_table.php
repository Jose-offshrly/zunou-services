<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table->dropColumn(['table_name', 'schema_name', 'sample_data']);
        });
    }

    public function down(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table->string('table_name')->nullable();
            $table->string('schema_name')->nullable();
            $table->text('sample_data')->nullable();
        });
    }
};
