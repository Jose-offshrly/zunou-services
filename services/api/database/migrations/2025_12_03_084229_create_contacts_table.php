<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('alt_email')->nullable();
            $table->string('telephone_number');
            $table->string('alt_telephone_number')->nullable();
            $table->jsonb('settings');
            $table->text('details');
            $table->timestamps();
            $table->softDeletes();

            // Grouped indexes:
            // - one for timestamp columns
            // - one for contact info columns
            $table->index(
                ['created_at', 'updated_at', 'deleted_at'],
                'contacts_timestamps_index'
            );

            $table->index(
                ['name', 'email', 'alt_email', 'telephone_number', 'alt_telephone_number'],
                'contacts_info_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
