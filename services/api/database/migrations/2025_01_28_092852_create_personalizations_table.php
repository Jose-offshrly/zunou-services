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
        Schema::create('personalizations', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('user_id');
            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->text('summary');
            $table->string('type');
            $table->text('keywords');
            $table->timestamp('processed_at');

            $table->uuid('preference_id');
            $table
                ->foreign('preference_id')
                ->references('id')
                ->on('preferences')
                ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personalizations');
    }
};
