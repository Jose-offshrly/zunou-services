<?php

use App\Models\Setting;
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
        // First, remove duplicate records keeping the most recently updated one
        $duplicates = Setting::query()
            ->select('user_id', 'organization_id')
            ->groupBy('user_id', 'organization_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $duplicate) {
            Setting::where('user_id', $duplicate->user_id)
                ->where('organization_id', $duplicate->organization_id)
                ->orderByDesc('updated_at')
                ->orderByDesc('created_at')
                ->skip(1)
                ->take(PHP_INT_MAX)
                ->get()
                ->each->delete();
        }

        // Add unique constraint on user_id and organization_id
        Schema::table('settings', function (Blueprint $table) {
            $table->unique(['user_id', 'organization_id'], 'settings_user_id_organization_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('settings_user_id_organization_id_unique');
        });
    }
};
