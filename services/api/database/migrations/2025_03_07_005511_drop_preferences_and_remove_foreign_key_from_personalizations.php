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
        Schema::table('personalizations', function (Blueprint $table) {
            $table->dropForeign(['preference_id']); // Drop the foreign key constraint
            $table->dropColumn('preference_id'); // Drop the column
        });

        Schema::dropIfExists('preferences'); // Drop the table
    }
};
