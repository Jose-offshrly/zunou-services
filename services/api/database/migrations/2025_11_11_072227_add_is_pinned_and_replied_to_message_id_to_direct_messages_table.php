<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('direct_messages', function (Blueprint $table) {
            $table->boolean('is_pinned')->default(false);
            $table->uuid('replied_to_message_id')->nullable();
            $table
                ->foreign('replied_to_message_id')
                ->references('id')
                ->on('direct_messages')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('direct_messages', function (Blueprint $table) {
            $table->dropColumn('is_pinned');
            $table->dropForeign(['replied_to_message_id']);
            $table->dropColumn('replied_to_message_id');
        });
    }
};
