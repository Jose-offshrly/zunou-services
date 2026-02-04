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
        Schema::create('getting_started', function (Blueprint $table) {
            $table->id();
            $table->uuid('organization_id');
            $table->uuid('pulse_id');

            $table->text('question'); // The question for the user
            $table->enum('status', ['pending', 'complete'])->default('pending');
            $table->timestamps();

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
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('getting_started');
    }
};
