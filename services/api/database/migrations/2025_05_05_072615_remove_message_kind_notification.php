<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('notification_user')
            ->whereIn('notification_id', function ($query) {
                $query
                    ->select('id')
                    ->from('notifications')
                    ->whereIn('kind', ['team_message', 'direct_message']);
            })
            ->delete();

        DB::table('notification_context')
            ->whereIn('notification_id', function ($query) {
                $query
                    ->select('id')
                    ->from('notifications')
                    ->whereIn('kind', ['team_message', 'direct_message']);
            })
            ->delete();

        DB::table('notifications')
            ->whereIn('kind', ['team_message', 'direct_message'])
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to restore deleted records as they are no longer valid
    }
};
