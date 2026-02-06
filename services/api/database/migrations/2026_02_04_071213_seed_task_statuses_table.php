<?php

use App\Enums\TaskStatusSystemType;
use App\Models\Pulse;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
        $systemStatuses = [
            [
                'label' => 'Open',
                'color' => '#2196F3',
                'system_type' => TaskStatusSystemType::START->value,
                'position' => 0,
            ],
            [
                'label' => 'In Progress',
                'color' => '#FF9800',
                'system_type' => TaskStatusSystemType::MIDDLE->value,
                'position' => 1,
            ],
            [
                'label' => 'Closed',
                'color' => '#4CAF50',
                'system_type' => TaskStatusSystemType::END->value,
                'position' => 2,
            ],
        ];

        // Get all existing pulses
        Pulse::chunk(100, function ($pulses) use ($systemStatuses) {
            foreach ($pulses as $pulse) {
                $now = now();
                
                foreach ($systemStatuses as $status) {
                    DB::table('task_statuses')->insert([
                        'id' => Str::uuid()->toString(),
                        'pulse_id' => $pulse->id,
                        'label' => $status['label'],
                        'color' => $status['color'],
                        'type' => null,
                        'system_type' => $status['system_type'],
                        'position' => $status['position'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        /// Delete all system statuses for all pulses
        DB::table('task_statuses')
            ->whereNotNull('pulse_id')
            ->whereIn('system_type', [
                TaskStatusSystemType::START->value,
                TaskStatusSystemType::MIDDLE->value,
                TaskStatusSystemType::END->value,
            ])
            ->delete();
    }
};
