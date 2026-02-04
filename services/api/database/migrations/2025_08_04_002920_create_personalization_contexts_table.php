<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personalization_contexts', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('pulse_id');
            $table->unsignedBigInteger('source_id')->after('user_id');
            $table->string('category');
            $table->text('context');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->foreign('source_id')
                ->references('id')
                ->on('personalization_sources')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('pulse_id')
                ->references('id')
                ->on('pulses')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personalization_contexts');
    }
};
