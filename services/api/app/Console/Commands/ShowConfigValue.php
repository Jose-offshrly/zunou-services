<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ShowConfigValue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'show-config-value {key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display the value of a given environment configuration key';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $key   = $this->argument('key');
        $value = env($key);

        if ($value !== null) {
            $this->info("The value of '{$key}' is: {$value}");
        } else {
            $this->warn("The key '{$key}' does not exist or has no value set.");
        }

        return Command::SUCCESS;
    }
}
