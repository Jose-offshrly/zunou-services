<?php

namespace Database\Seeders;

use App\Models\TaskStatus as TaskStatusModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TaskStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultStatuses = [
            [
                'type'     => 'default',
                'label'    => 'To Do',
                'color'    => '#737373',
                'position' => 1,
            ],
            [
                'type'     => 'default',
                'label'    => 'In Progress',
                'color'    => '#4A00E0',
                'position' => 2,
            ],
            [
                'type'     => 'default',
                'label'    => 'Completed',
                'color'    => '#10B981',
                'position' => 3,
            ]
        ];

        foreach ($defaultStatuses as $status) {
            // Check if a default status with this label already exists
            $existing = TaskStatusModel::whereNull('pulse_id')
                ->where('type', 'default')
                ->where('label', $status['label'])
                ->first();

            if (!$existing) {
                TaskStatusModel::create([
                    'id'       => Str::uuid(),
                    'pulse_id' => null,
                    'type'     => $status['type'],
                    'label'    => $status['label'],
                    'color'    => $status['color'],
                    'position' => $status['position'],
                ]);
            }
        }
    }
}
