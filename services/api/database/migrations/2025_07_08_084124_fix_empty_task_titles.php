<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Find tasks with empty or null titles and update them
        DB::table('tasks')
            ->where(function ($query) {
                $query
                    ->where('title', '')
                    ->orWhere('title', 'LIKE', '%\\s%') // Only whitespace
                    ->orWhereNull('title');
            })
            ->update([
                'title'      => 'Untitled Task',
                'updated_at' => now(),
            ]);
    }
};
