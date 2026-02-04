<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLastAskedAtToOrganizationOnboardingStatus extends Migration
{
    public function up()
    {
        Schema::table('organization_onboarding_status', function (
            Blueprint $table,
        ) {
            $table->timestamp('last_asked_at')->nullable()->after('notes');
        });
    }

    public function down()
    {
        Schema::table('organization_onboarding_status', function (
            Blueprint $table,
        ) {
            $table->dropColumn('last_asked_at');
        });
    }
}
