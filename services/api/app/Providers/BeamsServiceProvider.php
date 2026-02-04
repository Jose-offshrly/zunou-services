<?php

namespace App\Providers;

use App\Services\Pusher\BeamsService;
use Illuminate\Contracts\Support\DeferrableProvider;
use Illuminate\Support\ServiceProvider;

class BeamsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(config_path('beams.php'), 'beams');

        $this->app->singleton(BeamsService::class, function ($app) {
            $config = $app['config']->get('beams');
            return new BeamsService(
                enabled: (bool) ($config['enabled'] ?? true),
                instanceId: (string) ($config['instance_id'] ?? ''),
                secretKey: (string) ($config['secret_key'] ?? ''),
                interestPrefix: (string) ($config['interest_prefix'] ?? '')
            );
        });
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/beams.php' => config_path('beams.php'),
        ], 'config');
    }

    public function provides(): array
    {
        return [BeamsService::class];
    }
}


