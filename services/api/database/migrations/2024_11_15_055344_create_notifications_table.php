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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('description');
            $table
                ->enum('status', ['pending', 'dismissed', 'resolved'])
                ->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('organizations_notifications', function (
            Blueprint $table,
        ) {
            $table->uuid('organization_id');
            $table->uuid('notification_id');

            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
            $table
                ->foreign('notification_id')
                ->references('id')
                ->on('notifications')
                ->onDelete('cascade');
            $table->primary(['organization_id', 'notification_id']);
        });

        Schema::create('pulses_notifications', function (Blueprint $table) {
            $table->uuid('pulse_id');
            $table->uuid('notification_id');

            $table
                ->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');
            $table
                ->foreign('notification_id')
                ->references('id')
                ->on('notifications')
                ->onDelete('cascade');
            $table->primary(['pulse_id', 'notification_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pulses_notifications');
        Schema::dropIfExists('organizations_notifications');
        Schema::dropIfExists('notifications');
    }
};
