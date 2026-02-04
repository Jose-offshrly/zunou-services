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
        Schema::table('backup_transcripts', function (Blueprint $table) {
            // Optimize lookups of transcripts by data source and time.
            $table->index(
                ['data_source_id', 'received_at'],
                'backup_transcripts_data_source_received_at_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('backup_transcripts', function (Blueprint $table) {
            $table->dropIndex(
                'backup_transcripts_data_source_received_at_index'
            );
        });
    }
};
