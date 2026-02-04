<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMisalignmentAlertsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('misalignment_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id'); // Foreign key to the organization
            $table->string('violated_value'); // The name of the violated value
            $table->text('summary'); // A summary of the violation explanation
            $table->enum('severity', ['low', 'medium', 'high']); // Severity of the violation
            $table->timestamp('detected_at')->useCurrent(); // When the alert was generated
            $table->boolean('acknowledged')->default(false);
            $table->timestamp('acknowledged_at')->nullable();

            $table->timestamps(); // Standard created_at and updated_at timestamps

            // Define foreign key relationships
            $table
                ->foreign('organization_id')
                ->references('id')
                ->on('organizations')
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
        Schema::dropIfExists('misalignment_alerts');
    }
}
