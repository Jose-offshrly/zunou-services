<?php

use App\Enums\OrganizationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            // Update the default value for the 'status' column
            $table
                ->string('status')
                ->default(OrganizationStatus::Active->value) // Update to Active to bypass the onboarding process
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            // Revert the default value change if necessary
            $table
                ->string('status')
                ->default(OrganizationStatus::OnboardingTerms->value)
                ->change();
        });
    }
};
