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
        Schema::create('team_chat_system_threads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('task_type');
            $table->string('status')->default('pending');
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->uuid('pulse_id');
            $table->uuid('data_source_id')->nullable();
            $table->text('previous_context')->nullable();
            $table->nullableUuidMorphs('parent_thread');
            $table->timestamps();

            // Define foreign key relationships with cascading deletes
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');

            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table
                ->foreign('data_source_id')
                ->references('id')
                ->on('data_sources')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_chat_system_threads');
    }
};
