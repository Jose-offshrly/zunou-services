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
        Schema::create('pinned_organization_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // The user who is pinning
            $table->uuid('organization_user_id'); // The organization user being pinned
            $table->uuid('organization_id'); // The organization context
            $table->timestampTz('pinned_at')->useCurrent();
            $table->timestampsTz();

            // Foreign keys
            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table
                ->foreign('organization_user_id')
                ->references('id')
                ->on('organization_users')
                ->onDelete('cascade');

            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');

            // Unique constraint: a user can only pin an organization user once
            $table->unique(['user_id', 'organization_user_id'], 'pinned_org_user_unique');

            // Indexes for efficient queries
            $table->index(['user_id', 'organization_id']);
            $table->index('pinned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pinned_organization_users');
    }
};
