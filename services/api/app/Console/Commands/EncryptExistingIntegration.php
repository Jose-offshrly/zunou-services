<?php

namespace App\Console\Commands;

use App\Models\Integration;
use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class EncryptExistingIntegration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'encrypt:integration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'This command encrypts existing entegrations';

    public function handle()
    {
        $this->info('🔐 Starting API key encryption...');

        $total        = Integration::count();
        $updatedCount = 0;
        $skippedCount = 0;
        $failedCount  = 0;

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        Integration::chunk(100, function ($integrations) use (
            &$updatedCount,
            &$skippedCount,
            &$failedCount,
            $bar
        ) {
            foreach ($integrations as $integration) {
                // Bypass accessor — fetch raw DB value
                $rawApiKey = $integration->getRawOriginal('api_key');

                if (empty($rawApiKey)) {
                    $skippedCount++;
                    $bar->advance();

                    continue;
                }

                try {
                    // If this doesn't throw, it's already encrypted
                    Crypt::decryptString($rawApiKey);
                    $skippedCount++;
                } catch (DecryptException $e) {
                    // Not encrypted — encrypt and save
                    try {
                        $integration->api_key = Crypt::encryptString(
                            $rawApiKey,
                        );
                        $integration->save();
                        $updatedCount++;
                    } catch (\Exception $ex) {
                        $failedCount++;
                        Log::error('❌ Failed to encrypt API key', [
                            'integration_id' => $integration->id,
                            'error'          => $ex->getMessage(),
                        ]);
                    }
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info(
            "✅ Done. Encrypted: {$updatedCount}, Skipped: {$skippedCount}, Failed: {$failedCount}",
        );

        return Command::SUCCESS;
    }
}
