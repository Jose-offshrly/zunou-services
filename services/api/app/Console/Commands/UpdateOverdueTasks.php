<?php

namespace App\Console\Commands;

use App\Enums\TaskStatus;
use App\Models\Task;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class UpdateOverdueTasks extends Command
{
    protected $signature = 'tasks:update-overdue';

    protected $description = 'Update the status of tasks that are overdue';

    public function handle()
    {
        $now = Carbon::now();

        $updated = Task::where('due_date', '<', $now)
            ->whereNotIn('status', [
                TaskStatus::COMPLETED->value,
                TaskStatus::OVERDUE->value,
            ])
            ->update(['status' => TaskStatus::OVERDUE->value]);

        $this->info("Updated {$updated} tasks to overdue.");
    }
}
