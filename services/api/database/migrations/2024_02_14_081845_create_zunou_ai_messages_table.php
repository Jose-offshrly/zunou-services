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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zunou_ai_messages');
    }
};
