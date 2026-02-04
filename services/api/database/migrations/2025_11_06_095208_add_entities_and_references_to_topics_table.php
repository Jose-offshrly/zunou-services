<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\TeamThread;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            // Add as nullable first to avoid NOT NULL violations on existing rows
            $table->nullableUuidMorphs('entity');
            // Use string for reference_id to support both UUIDs and integers
            $table->string('reference_id')->nullable();
            $table->string('reference_type')->nullable();
            $table->index(['reference_id', 'reference_type']);
        });

        // Transfer existing linkage from team_thread_id to polymorphic entity
        DB::table('topics')->update([
            'entity_id' => DB::raw('team_thread_id'),
            'entity_type' => TeamThread::class,
        ]);

        // Enforce NOT NULL after data is populated (PostgreSQL-safe)
        DB::statement(
            'ALTER TABLE "topics" ALTER COLUMN "entity_id" SET NOT NULL'
        );
        DB::statement(
            'ALTER TABLE "topics" ALTER COLUMN "entity_type" SET NOT NULL'
        );

        // Drop old foreign key, index, and column for team_thread_id now that data is migrated
        Schema::table('topics', function (Blueprint $table) {
            $table->dropForeign(['team_thread_id']);
            $table->dropIndex(['team_thread_id']);
            $table->dropColumn('team_thread_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('topics', function (Blueprint $table) {
            // Recreate team_thread_id (nullable to avoid requiring data rewrite)
            $table->uuid('team_thread_id')->nullable()->after('id');
        });

        // Backfill team_thread_id from polymorphic entity where applicable
        DB::table('topics')
            ->where('entity_type', TeamThread::class)
            ->update([
                'team_thread_id' => DB::raw('entity_id'),
            ]);

        Schema::table('topics', function (Blueprint $table) {
            // Restore foreign key and index
            $table
                ->foreign('team_thread_id')
                ->references('id')
                ->on('team_threads')
                ->onDelete('cascade');
            $table->index('team_thread_id');

            // Drop polymorphic columns
            $table->dropMorphs('entity');
            // Drop reference columns manually (since they were created manually, not with morphs)
            // Drop index by name (PostgreSQL creates it with columns in different order)
            DB::statement(
                'DROP INDEX IF EXISTS topics_reference_type_reference_id_index'
            );
            $table->dropColumn(['reference_id', 'reference_type']);
        });
    }
};
