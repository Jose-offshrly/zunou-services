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
        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('assigned_to')->nullable()->change();
            $table->uuid('category_id')->nullable()->change();
            $table->uuid('organization_id')->nullable()->change();
            $table->string('status')->default('TODO')->change();
            $table->string('priority')->default('MEDIUM')->change();
            $table->timestamp('due_date')->nullable()->change();

            $table->string('type')->default('TASK')->nullable();
        });
    }
};
