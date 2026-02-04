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
        Schema::create('backup_transcripts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('content');
            $table->timestamp('received_at');
            $table->uuid('data_source_id');

            $table
                ->foreign('data_source_id')
                ->references('id')
                ->on('data_sources')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_transcripts');
    }
};
