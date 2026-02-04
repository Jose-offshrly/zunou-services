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
        Schema::create('onboarding_data_links', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('onboarding_item_id')
                ->constrained('onboarding_items')
                ->onDelete('cascade');
            $table->uuid('data_source_id')->constrained('data_sources');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('onboarding_data_links');
    }
};
