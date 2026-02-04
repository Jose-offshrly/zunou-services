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
        Schema::create('organization_group_pulse_member', function (
            Blueprint $table,
        ) {
            $table->uuid('organization_group_id');
            $table->uuid('pulse_member_id');

            $table
                ->foreign('organization_group_id')
                ->references('id')
                ->on('organization_groups')
                ->onDelete('cascade');

            $table
                ->foreign('pulse_member_id')
                ->references('id')
                ->on('pulse_members')
                ->onDelete('cascade');

            $table->primary(['organization_group_id', 'pulse_member_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_group_pulse_member');
    }
};
