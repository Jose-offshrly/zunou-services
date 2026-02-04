<?php

use App\Enums\DataSourceOrigin;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table
                ->enum(
                    'origin',
                    array_column(DataSourceOrigin::cases(), 'value'),
                )
                ->default(DataSourceOrigin::CUSTOM->value)
                ->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_sources', function (Blueprint $table) {
            $table->dropColumn('origin');
        });
    }
};
