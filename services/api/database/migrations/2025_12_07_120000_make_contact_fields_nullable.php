<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            $table->string('telephone_number')->nullable()->change();
            $table->text('details')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->string('telephone_number')->nullable(false)->change();
            $table->text('details')->nullable(false)->change();
        });
    }
};
