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
        Schema::table('threads', function (Blueprint $table) {
            // Add the is_active column with a default value of false
            $table->boolean('is_active')->default(false)->after('id');

            // Add an index on the is_active column for faster queries
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            // Drop the index before dropping the column
            $table->dropIndex(['is_active']);

            // Drop the is_active column
            $table->dropColumn('is_active');
        });
    }
};
