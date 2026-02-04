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
        Schema::create('actionables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('description');
            $table->uuid('pulse_id');
            $table->uuid('organization_id');
            $table->uuid('data_source_id');
            $table->timestamps();

            $table->foreign('pulse_id')->references('id')->on('pulses')->onDelete('cascade');
            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('data_source_id')->references('id')->on('data_sources')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actionables');
    }
};
