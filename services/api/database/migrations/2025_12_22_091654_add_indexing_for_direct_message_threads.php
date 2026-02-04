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
        Schema::table('direct_message_threads', function (Blueprint $table) {
            // Speed up lookups and pagination of threads per organization.
            $table->index(
                ['organization_id'],
                'direct_message_threads_organization_id_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('direct_message_threads', function (Blueprint $table) {
            $table->dropIndex('direct_message_threads_organization_id_index');
        });
    }
};
