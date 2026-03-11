<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('notifiable_notifications', function (Blueprint $table) {
            $table->string('notifiable_type');
            $table->uuid('notifiable_id');
            $table->uuid('notification_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->primary(['notifiable_type', 'notifiable_id', 'notification_id'], 'notifiable_notifications_pk');
            $table->index(['notifiable_type', 'notifiable_id'], 'notifiable_notifications_notifiable_idx');
            $table->index('notification_id', 'notifiable_notifications_notification_idx');
        });
    }

    public function down(): void {
        Schema::dropIfExists('notifiable_notifications');
    }
};
end_of_file