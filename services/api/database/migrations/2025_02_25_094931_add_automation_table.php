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
        //
        Schema::create('automations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('strategy_id');
            $table->uuid('user_id');
            $table->boolean('on_queue');
            $table->string('type');
            $table->timestamp('next_run_at');
            $table->timestamps();

            $table
                ->foreign('strategy_id')
                ->references('id')
                ->on('strategies')
                ->onDelete('cascade');

            $table
                ->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('automations');
    }
};
