<?php

namespace App\Services\Personalization;

use App\Services\OpenAIService;
use Illuminate\Support\Facades\Log;
use Exception;

class OpenAIPersonalizationService
{
    public function createCompletion(
        array $messages,
        ?array $responseSchema = null,
        float $temperature = 0.5,
        string $model = 'gpt-4.1'
    ): array {
        $requestBody = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
        ];

        if ($responseSchema !== null) {
            $requestBody['response_format'] = $responseSchema;
        }

        try {
            $response = OpenAIService::createCompletion($requestBody);
            return $response->toArray();
        } catch (Exception $e) {
            Log::error('OpenAI Personalization Service Error', [
                'error' => $e->getMessage(),
                'request_body' => $requestBody,
            ]);
            throw new Exception("OpenAI API call failed: " . $e->getMessage(), 0, $e);
        }
    }

    public function parseResponse(array $response)
    {
        if (!isset($response['choices'][0]['message']['content'])) {
            throw new Exception('Invalid OpenAI response structure: missing content');
        }

        $content = $response['choices'][0]['message']['content'];

        // Try to decode as JSON first (for structured responses)
        $decoded = json_decode($content, true);
        
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // If not valid JSON, return as string (for text responses)
        return $content;
    }

    public function createPersonalizationCompletion(
        string $systemPrompt,
        string $userContent,
        ?array $responseSchema = null,
        float $temperature = 0.5
    ) {
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt,
            ],
            [
                'role' => 'user',
                'content' => $userContent,
            ],
        ];

        $response = $this->createCompletion($messages, $responseSchema, $temperature);
        return $this->parseResponse($response);
    }
}