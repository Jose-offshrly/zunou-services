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
        Schema::table('organizations', function (Blueprint $table) {
            $table
                ->string('subscription_status')
                ->nullable()
                ->after('stripe_id');
            $table
                ->dateTime('subscription_end_date')
                ->nullable()
                ->after('subscription_status');
            $table
                ->integer('subscription_seats')
                ->default(0)
                ->after('subscription_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn('subscription_status');
            $table->dropColumn('subscription_end_date');
            $table->dropColumn('subscription_seats');
        });
    }
};
