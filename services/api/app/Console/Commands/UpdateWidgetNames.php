<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateWidgetNames extends Command
{
    protected $signature = 'widgets:update-names';

    protected $description = 'Update widget names according to new mapping';

    public function handle()
    {
        $mapping = [
            'happening-now' => 'active-meetings',
            'ping-board'    => 'team-chat',
        ];

        foreach ($mapping as $oldName => $newName) {
            $updated = DB::table('widgets')
                ->where('name', $oldName)
                ->update(['name' => $newName]);

            if ($updated) {
                $this->info("Updated '{$oldName}' to '{$newName}'.");
            } else {
                $this->warn("No widget found with name '{$oldName}'.");
            }
        }

        $this->info('Widget name updates complete.');

        return 0;
    }
}
