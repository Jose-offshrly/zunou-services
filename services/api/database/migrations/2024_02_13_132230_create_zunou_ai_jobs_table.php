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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zunou_ai_jobs');
    }
};
