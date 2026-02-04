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
        Schema::create('monthly_time_saved', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->integer('time_saved'); // Time saved in minutes
            $table->integer('month'); // Month of the year
            $table->integer('year'); // Year

            // Timestamps for created and updated
            $table->timestamps();

            // Foreign key constraint to organizations
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            // Unique index to prevent duplicate entries for the same month and year
            $table->unique(['organization_id', 'month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_time_saved');
    }
};
