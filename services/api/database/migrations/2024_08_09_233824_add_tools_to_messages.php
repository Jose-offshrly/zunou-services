<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->json('tool_calls')->nullable();
            $table->string('tool_call_id')->nullable();
            $table->boolean('is_system')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn('tool_calls');
            $table->dropColumn('tool_call_id');
            $table->dropColumn('is_system');
        });
    }
};
