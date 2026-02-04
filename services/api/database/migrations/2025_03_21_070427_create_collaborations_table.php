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
        Schema::create('collaborations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('description');
            $table->timestamp('start_at');
            $table->timestamp('end_at')->nullable();
            $table->string('meeting_link');
            $table->string('status');
            $table->uuid('pulse_id');
            $table->uuid('organization_id');
            $table->timestamps();
            $table->softDeletes();

            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

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
        Schema::dropIfExists('collaborations');
    }
};
