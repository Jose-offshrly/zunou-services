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
        Schema::table('pulse_members', function (Blueprint $table) {
            $table->integer('order')->nullable()->after('pulse_id');
        });

        $organizationUsers = DB::table('organization_users')
            ->select('organization_id', 'user_id')
            ->get();

        foreach ($organizationUsers as $orgUser) {
            // For ONETOONE and TEAM categories
            foreach (['ONETOONE', 'TEAM'] as $category) {
                $pulseMembers = DB::table('pulse_members')
                    ->join('pulses', function ($join) use ($category) {
                        $join
                            ->on('pulse_members.pulse_id', '=', 'pulses.id')
                            ->whereNull('pulses.deleted_at')
                            ->where('pulses.category', $category);
                    })
                    ->where('pulses.organization_id', $orgUser->organization_id)
                    ->where('pulse_members.user_id', $orgUser->user_id)
                    ->orderBy('pulse_members.id')
                    ->select('pulse_members.id')
                    ->get();

                foreach ($pulseMembers as $i => $member) {
                    DB::table('pulse_members')
                        ->where('id', $member->id)
                        ->update(['order' => $i + 1]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pulse_members', function (Blueprint $table) {
            $table->dropColumn('order');
        });
    }
};
