<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Adds a composite index on (entity_type, entity_id, user_id) to speed up
     * participant lookups that filter by morph type + morph id + user.
     * The existing attendees_user_id_index only covers user_id alone and
     * doesn't help when the query filters on the morph columns first.
     */
    public function up(): void
    {
        Schema::table('attendees', function (Blueprint $table) {
            $table->index(
                ['entity_type', 'entity_id', 'user_id'],
                'attendees_entity_type_entity_id_user_id_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendees', function (Blueprint $table) {
            $table->dropIndex('attendees_entity_type_entity_id_user_id_index');
        });
    }
};
