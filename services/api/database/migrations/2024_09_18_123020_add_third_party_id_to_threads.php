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
            $table->string('third_party_id')->nullable();
        });

        DB::table('threads')->update(['third_party_id' => DB::raw('id')]);

        Schema::table('threads', function (Blueprint $table) {
            $table
                ->string('third_party_id')
                ->nullable(false)
                ->unique()
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('threads', function (Blueprint $table) {
            $table->dropColumn('third_party_id');
        });
    }
};
