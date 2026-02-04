<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

class TextAgentService
{
    private const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
    private const DEFAULT_MODEL = 'gpt-4.1';

    private Client $httpClient;

    public function __construct()
    {
        $this->httpClient = new Client([
            'timeout' => 120,
            'connect_timeout' => 10,
        ]);
    }

    /**
     * Non-streaming completion from OpenAI's Responses API.
     * Returns the full response as an array.
     *
     * @param User $user
     * @param array $params
     * @return array The full response or error array
     */
    public function completion(User $user, array $params): array
    {
        $apiKey = $this->resolveApiKey($user);

        if (!$apiKey) {
            return [
                'error' => 'No OpenAI API key configured',
                'status' => 500,
            ];
        }

        $requestBody = $this->buildRequestBody($params, stream: false);

        Log::info('TextAgentService: Non-streaming request', [
            'model' => $requestBody['model'],
            'user_id' => $user->id,
            'organization_id' => $params['organization_id'],
        ]);

        try {
            $response = $this->httpClient->post(self::OPENAI_RESPONSES_URL, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => $requestBody,
            ]);

            $body = $response->getBody()->getContents();
            $decoded = json_decode($body, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('TextAgentService: Invalid JSON response', [
                    'body' => $body,
                ]);
                return [
                    'error' => 'Invalid response from OpenAI',
                    'status' => 500,
                ];
            }

            return $decoded;

        } catch (RequestException $e) {
            $statusCode = $e->hasResponse() ? $e->getResponse()->getStatusCode() : 500;
            $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : '';

            Log::error('TextAgentService: OpenAI request failed', [
                'status' => $statusCode,
                'error' => $errorBody,
                'user_id' => $user->id,
            ]);

            // Try to extract error message from OpenAI response
            $errorMessage = 'OpenAI API error';
            $decoded = json_decode($errorBody, true);
            if ($decoded && isset($decoded['error']['message'])) {
                $errorMessage = $decoded['error']['message'];
            }

            return [
                'error' => $errorMessage,
                'status' => $statusCode,
            ];
        } catch (\Exception $e) {
            Log::error('TextAgentService: Unexpected error', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            return [
                'error' => $e->getMessage(),
                'status' => 500,
            ];
        }
    }

    /**
     * Stream a completion from OpenAI's Responses API.
     * 
     * This method uses a callback to handle each SSE event as it arrives,
     * enabling true real-time streaming to the client.
     *
     * @param User $user
     * @param array $params
     * @param callable $onEvent Callback function called for each event: fn(array $event) => void
     * @return void
     */
    public function streamCompletion(User $user, array $params, callable $onEvent): void
    {
        $apiKey = $this->resolveApiKey($user);

        if (!$apiKey) {
            $onEvent([
                'type' => 'error',
                'code' => 'api_key_missing',
                'message' => 'No OpenAI API key configured',
            ]);
            return;
        }

        $requestBody = $this->buildRequestBody($params, stream: true);

        Log::info('TextAgentService: Starting stream', [
            'model' => $requestBody['model'],
            'user_id' => $user->id,
            'organization_id' => $params['organization_id'],
        ]);

        try {
            $this->executeStreamingRequest($apiKey, $requestBody, $onEvent);
        } catch (\Exception $e) {
            Log::error('TextAgentService: Stream error', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);

            $onEvent([
                'type' => 'error',
                'code' => 'openai_error',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Resolve the API key - user's BYOK or system default.
     */
    private function resolveApiKey(User $user): ?string
    {
        // User's own key takes priority (BYOK)
        if ($user->openai_api_key) {
            return $user->openai_api_key;
        }

        // Fall back to system key
        return config('zunou.openai.api_key');
    }

    /**
     * Build the request body for OpenAI Responses API.
     */
    private function buildRequestBody(array $params, bool $stream = true): array
    {
        $body = [
            'model' => $params['model'] ?? self::DEFAULT_MODEL,
            'instructions' => $params['instructions'],
            'input' => $params['input'],
            'stream' => $stream,
        ];

        // Pass through optional parameters
        if (!empty($params['tools'])) {
            $body['tools'] = $this->normalizeTools($params['tools']);
        }

        if (!empty($params['tool_choice'])) {
            $body['tool_choice'] = $params['tool_choice'];
        }

        if (isset($params['temperature'])) {
            $body['temperature'] = (float) $params['temperature'];
        }

        if (isset($params['max_output_tokens'])) {
            $body['max_output_tokens'] = (int) $params['max_output_tokens'];
        }

        if (!empty($params['previous_response_id'])) {
            $body['previous_response_id'] = $params['previous_response_id'];
        }

        // OpenAI uses 'conversation' for multi-turn context
        if (!empty($params['conversation'])) {
            $body['conversation'] = $params['conversation'];
        }

        return $body;
    }

    /**
     * Normalize tools array to ensure empty objects are preserved.
     * 
     * PHP's json_encode() converts empty arrays [] to JSON arrays,
     * but OpenAI expects empty objects {} for properties/parameters.
     * Cast empty arrays to (object)[] to preserve {} in JSON output.
     */
    private function normalizeTools(array $tools): array
    {
        foreach ($tools as &$tool) {
            if (isset($tool['parameters'])) {
                // Ensure 'properties' is an object, not array
                if (isset($tool['parameters']['properties']) && empty($tool['parameters']['properties'])) {
                    $tool['parameters']['properties'] = (object) [];
                }
                // Ensure 'parameters' itself is an object if empty
                if (empty($tool['parameters'])) {
                    $tool['parameters'] = (object) [];
                }
            }
        }
        
        return $tools;
    }

    /**
     * Execute the streaming request to OpenAI using Guzzle.
     * Processes SSE events in real-time as they arrive.
     */
    private function executeStreamingRequest(string $apiKey, array $requestBody, callable $onEvent): void
    {
        try {
            $response = $this->httpClient->post(self::OPENAI_RESPONSES_URL, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'text/event-stream',
                ],
                'json' => $requestBody,
                'stream' => true,
            ]);

            $body = $response->getBody();
            $buffer = '';

            // Read the stream in chunks
            while (!$body->eof()) {
                $chunk = $body->read(1024);
                $buffer .= $chunk;

                // Process complete lines from the buffer
                while (($newlinePos = strpos($buffer, "\n")) !== false) {
                    $line = substr($buffer, 0, $newlinePos);
                    $buffer = substr($buffer, $newlinePos + 1);

                    $this->processSSELine(trim($line), $onEvent);
                }
            }

            // Process any remaining data in the buffer
            if (!empty(trim($buffer))) {
                $this->processSSELine(trim($buffer), $onEvent);
            }

        } catch (RequestException $e) {
            $statusCode = $e->hasResponse() ? $e->getResponse()->getStatusCode() : 0;
            $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : '';

            Log::error('TextAgentService: OpenAI request failed', [
                'status' => $statusCode,
                'error' => $errorBody,
            ]);

            $onEvent([
                'type' => 'error',
                'code' => 'openai_error',
                'message' => "OpenAI API error: {$statusCode}",
                'details' => $errorBody,
            ]);
        }
    }

    /**
     * Process a single SSE line and emit the event.
     */
    private function processSSELine(string $line, callable $onEvent): void
    {
        // Skip empty lines and event type lines
        if (empty($line) || str_starts_with($line, 'event:')) {
            return;
        }

        // Handle data lines
        if (str_starts_with($line, 'data: ')) {
            $jsonData = substr($line, 6);

            // Check for stream end marker
            if ($jsonData === '[DONE]') {
                return;
            }

            $decoded = json_decode($jsonData, true);
            if ($decoded && json_last_error() === JSON_ERROR_NONE) {
                $onEvent($decoded);
            }
        }
    }
}
