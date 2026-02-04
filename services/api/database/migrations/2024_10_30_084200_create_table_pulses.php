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
        Schema::create('pulses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
            $table->string('name'); // e.g., 'HR Pulse', 'Admin Pulse'
            $table->string('type'); // e.g., 'hr', 'admin', etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('master_pulses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // e.g., 'HR Pulse', 'Admin Pulse'
            $table->string('type'); // e.g., 'hr', 'admin', etc.
            $table->string('status'); // e.g., 'hr', 'admin', etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('master_seed_data', function (Blueprint $table) {
            $table
                ->uuid('master_pulse_id')
                ->nullable()
                ->constrained('pulses')
                ->onDelete('cascade');
            $table->text('metadata')->nullable(); // Additional info, if needed
        });

        Schema::dropIfExists('master_seed_data');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_pulses');
        Schema::dropIfExists('pulses');
        Schema::table('master_seed_data', function (Blueprint $table) {
            $table->dropColumn('master_pulse_id');
            $table->dropColumn('metadata');
        });
    }
};
