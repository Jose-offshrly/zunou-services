<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_sources', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('source');
            $table->string('source_id');
            $table->uuid('user_id');
            $table->timestamp('date')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index(['source', 'source_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_sources');
    }
};


