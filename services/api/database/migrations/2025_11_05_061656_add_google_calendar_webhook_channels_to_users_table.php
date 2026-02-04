<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_calendar_channel_id')->nullable()->after('google_calendar_refresh_token');
            $table->string('google_calendar_resource_id')->nullable()->after('google_calendar_channel_id');
            $table->timestamp('google_calendar_channel_expires_at')->nullable()->after('google_calendar_resource_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'google_calendar_channel_id',
                'google_calendar_resource_id',
                'google_calendar_channel_expires_at',
            ]);
        });
    }
};