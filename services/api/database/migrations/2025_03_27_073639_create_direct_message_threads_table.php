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
        Schema::create('direct_message_threads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            // JSON column to store an array of participant IDs.
            $table->json('participants');
            $table->timestamps();

            // Foreign key constraint for organization.
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('direct_message_threads');
    }
};
