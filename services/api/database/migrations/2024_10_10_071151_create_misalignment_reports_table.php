<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMisalignmentReportsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('misalignment_reports', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->uuid('organization_id'); // UUID for foreign key
            $table->uuid('thread_id'); // UUID for foreign key
            $table->string('violated_value'); // The name of the violated value
            $table->text('explanation'); // Explanation of how the value was violated
            $table->string('severity')->after('explanation')->nullable();
            $table->timestamp('detected_at')->useCurrent(); // When the violation was detected
            $table->timestamps();

            // Define foreign key relationships
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade');
            $table
                ->foreign('thread_id')
                ->references('id')
                ->on('threads')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('misalignment_reports');
    }
}
