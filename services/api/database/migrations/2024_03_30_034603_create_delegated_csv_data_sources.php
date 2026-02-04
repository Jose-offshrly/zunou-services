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
        Schema::create('delegated_csv_data_sources', function (
            Blueprint $table,
        ) {
            $table->bigIncrements('id');
            $table->uuid('data_source_id');
            $table
                ->foreign('data_source_id')
                ->references('id')
                ->on('data_sources')
                ->onDelete('cascade');
            $table->string('schema_name', 1024);
            $table->string('table_name', 1024);
            $table->longText('schema_info');
            $table->longText('sample_data');
            $table->longText('prompt_hint')->default('');
            $table->timestamps();

            // Create a composite unique index for schema_name and table_name
            $table->unique(
                ['schema_name', 'table_name'],
                'schema_name_table_name_unique',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delegated_csv_data_sources');
    }
};
