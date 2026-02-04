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
        Schema::table('organization_users', function (Blueprint $table) {
            $table->index(
                'invite_code',
                'organization_users_invite_code_index'
            );
            $table->index('user_id', 'organization_users_user_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_users', function (Blueprint $table) {
            $table->dropIndex('organization_users_user_id_index');
            $table->dropIndex('organization_users_invite_code_index');
        });
    }
};
