<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Set the category value TEAM to pulses where category is NULL
     */
    public function up(): void
    {
        DB::table('pulses')
            ->whereNull('category')
            ->update(['category' => 'TEAM']);
    }
};
