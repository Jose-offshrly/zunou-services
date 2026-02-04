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
        // Drop the labels table if it exists
        Schema::dropIfExists('labels');

        // Recreate the labels table with a UUID primary key
        Schema::create('labels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->timestamps();
        });

        // Create the pivot table for labels and notes
        Schema::create('label_note', function (Blueprint $table) {
            $table->uuid('label_id');
            $table->uuid('note_id');
            $table->timestamps();

            $table->primary(['label_id', 'note_id']);
            $table->foreign('label_id')->references('id')->on('labels')->onDelete('cascade');
            $table->foreign('note_id')->references('id')->on('notes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('label_note');
        Schema::dropIfExists('labels');

        // Recreate the original labels table with a bigint id and morph columns
        Schema::create('labels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->uuidMorphs('entity');
            $table->timestamps();
        });
    }
};
