<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('contact_user', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')
                ->constrained();
            $table->foreignUuid('contact_id')
                ->constrained();
            $table->timestamps();

            $table->unique(['user_id', 'contact_id'], 'contact_user_user_contact_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_user');
    }
};


