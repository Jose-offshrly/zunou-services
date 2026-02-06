<?php

use App\Enums\TaskStatus as TaskStatusEnum;
use App\Enums\TaskStatusSystemType;
use App\Models\Task;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Map old enum values to new system_type values
        $statusMap = [
            'TODO' => TaskStatusSystemType::START->value,
            'INPROGRESS' => TaskStatusSystemType::MIDDLE->value,
            'COMPLETED' => TaskStatusSystemType::END->value,
            'OVERDUE' => TaskStatusSystemType::START->value,
            'NOT_STARTED' => TaskStatusSystemType::START->value, // Handle legacy value
        ];

        Task::whereNotNull('entity_id')
            ->whereNotNull('status')
            ->chunk(100, function ($tasks) use ($statusMap) {
                foreach ($tasks as $task) {
                    // Get the system_type for this task's current status
                    $systemType = $statusMap[$task->status->value] ?? null;
                    
                    if (!$systemType) {
                        continue;
                    }

                    // Find the corresponding TaskStatus record for this pulse
                    $taskStatus = DB::table('task_statuses')
                        ->where('pulse_id', $task->entity_id)
                        ->where('system_type', $systemType)
                        ->first();

                    if ($taskStatus) {
                        $task->update(['task_status_id' => $taskStatus->id]);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set all task_status_id back to null
        DB::table('tasks')->update(['task_status_id' => null]);
    }
};