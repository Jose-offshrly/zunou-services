<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('data_source_metadata');
    }

    public function down(): void
    {
        // If you want to recreate the table in a rollback, define its schema here.
        Schema::create('data_source_metadata', function (Blueprint $table) {
            // Add columns and their definitions here as needed.
        });
    }
};
