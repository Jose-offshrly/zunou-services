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
        Schema::create('ai_agents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('pulse_id');
            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

            $table->uuid('organization_id');
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            $table->string('name');
            $table->string('description');
            $table->string('icon')->nullable();
            $table->text('guidelines')->nullable();

            $table->string('agent_type')->nullable();
            $table->text('credentials')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_agents');
    }
};
