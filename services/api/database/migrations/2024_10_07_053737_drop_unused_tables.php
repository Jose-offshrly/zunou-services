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
        Schema::dropIfExists('delegated_csv_data_sources');
        Schema::dropIfExists('zunou_ai_messages');
        Schema::dropIfExists('zunou_ai_jobs');
        Schema::dropIfExists('zunou_ai_threads');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
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

        Schema::create('zunou_ai_threads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
            $table->string('source');
            $table->string('source_id');
            $table->string('thread_id')->unique();
            $table->timestamps();

            $table->index(['source']);
            $table->index(['source', 'source_id']);
        });

        Schema::create('zunou_ai_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('last_error')->nullable();
            $table->string('message');
            $table->uuid('organization_id');
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
            $table->string('status')->default('QUEUED');
            $table->integer('zunou_ai_job_id')->nullable();
            $table->uuid('zunou_ai_thread_id');
            $table
                ->foreign('zunou_ai_thread_id')
                ->references('id')
                ->on('zunou_ai_threads')
                ->onDelete('cascade');
            $table->timestamps();

            $table->index(['organization_id', 'status']);
            $table->index(['status']);
        });

        Schema::create('zunou_ai_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('message');
            $table->uuid('zunou_ai_job_id');
            $table
                ->foreign('zunou_ai_job_id')
                ->references('id')
                ->on('zunou_ai_jobs')
                ->onDelete('cascade');
            $table->timestamps();
        });
    }
};
