<?php

namespace App\Actions\FireFlies;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CallFireFliesApiAction
{
    /**
     * Call FireFlies API and return response or error data
     */
    public function handle(
        string $api_key,
        string $query,
        ?array $variables = null,
    ): array {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$api_key}",
            'Content-Type'  => 'application/json',
        ])
            ->connectTimeout(15)
            ->timeout(90)
            ->retry(3, 5000)
            ->post(config('fireflies.api_url'), [
                'query'     => $query,
                'variables' => $variables,
            ]);

        Log::info('fireflies response:', $response->json());

        $errors = $response->json('errors');

        if (
            ! empty($errors) && is_array($errors) && isset($errors[0]['message'])
        ) {
            $error = $errors[0];

            Log::error('CallFireFliesApiAction: API error occurred', [
                'message' => $error['message'],
                'errors' => $errors
            ]);
            
            // Return empty array on error
            return [];
        }

        return $response->json();
    }
}
