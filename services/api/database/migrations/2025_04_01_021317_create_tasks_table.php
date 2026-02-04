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
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('entity');
            $table->string('title');
            $table->string('description')->nullable();
            $table->uuid('assigned_to');
            $table->uuid('category_id');
            $table->uuid('organization_id');
            $table->string('status');
            $table->string('priority');
            $table->timestamp('due_date');
            $table->timestamps();
            $table->softDeletes();

            $table
                ->foreign('assigned_to')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table
                ->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('cascade');

            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('parent_id')->nullable();

            $table
                ->foreign('parent_id')
                ->references('id')
                ->on('tasks')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
