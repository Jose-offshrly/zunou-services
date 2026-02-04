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
        Schema::create('data_source_metadata', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('data_source_id');
            $table
                ->foreign('data_source_id')
                ->references('id')
                ->on('data_sources')
                ->onDelete('cascade');
            $table->string('data_source_type', 1024);
            $table->string('schema_name', 1024);
            $table->string('table_name', 1024);
            $table->longText('schema_info');
            $table->longText('sample_data');
            $table->json('data_source_metadata');
            $table->longText('prompt_hint')->default('');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_source_metadata');
    }
};
