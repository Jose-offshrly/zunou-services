<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interests', function (Blueprint $table) {
            $table->text('looking_for')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('interests', function (Blueprint $table) {
            $table->text('looking_for')->nullable(false)->change();
        });
    }
};
