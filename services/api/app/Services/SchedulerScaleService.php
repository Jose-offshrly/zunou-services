<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SchedulerScaleService
{
    public function getStatus(): array
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => (string) config('zunou.companion.scale_api_key'),
            ])->get(config('zunou.companion.scale_status_url'));

            if (! $response->successful()) {
                Log::error('SchedulerScaleService.getStatus failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error'   => 'Non-200 response',
                    'status'  => $response->status(),
                ];
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::error('SchedulerScaleService.getStatus exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    public function triggerScale(int|string $direction = 'up', ?string $environment = 'staging'): array
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => (string) config('zunou.companion.scale_api_key'),
            ])->post(
                config('zunou.companion.scale_url'),
                [
                    'direction'   => $direction,
                    'environment' => $environment,
                ],
            );

            if (! $response->successful()) {
                Log::error('SchedulerScaleService.triggerScale failed', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error'   => 'Non-200 response',
                    'status'  => $response->status(),
                ];
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::error('SchedulerScaleService.triggerScale exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}
