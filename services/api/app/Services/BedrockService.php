<?php

namespace App\Services;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Illuminate\Support\Facades\Log;

class BedrockService
{
    protected static $client;

    public static function getClient()
    {
        if (! self::$client) {
            self::$client = new BedrockRuntimeClient([
                'version' => 'latest',
                'region'  => config('zunou.aws.region'),
                'credentials' => [
                    'key'    => config('zunou.aws.key'),
                    'secret' => config('zunou.aws.secret'),
                ],
            ]);
        }

        return self::$client;
    }

    public static function invokeModel(string $modelId, array $body)
    {
        $client = self::getClient();
        
        try {
            $result = $client->invokeModel([
                'contentType' => 'application/json',
                'body' => json_encode($body),
                'modelId' => $modelId,
            ]);
            
            return json_decode($result['body'], true);
        } catch (\Exception $e) {
            Log::error("Bedrock invocation error: {$e->getMessage()}", ['body' => $body]);

            throw $e;
        }
    }

    public static function invokeModelAsync(string $modelId, array $body)
    {
        $client = self::getClient();

        return $client->invokeModelAsync([
            'contentType' => 'application/json',
            'accept'      => 'application/json',
            'body'        => json_encode($body),
            'modelId'     => $modelId,
        ])
        ->then(function ($result) {
            return json_decode($result['body'], true);
        })
        ->otherwise(function ($e) use ($body) {
            Log::error("Bedrock async invocation error: {$e->getMessage()}", ['body' => $body]);
            throw $e;
        });
    }

    public static function createCompletion(string $prompt, array $options = [])
    {
        $modelId = $options['model'] ?? config('zunou.bedrock.model');
        
        $body = [
            'anthropic_version' => 'bedrock-2023-05-31',
            'max_tokens' => $options['max_tokens'] ?? 1024,
            'temperature' => $options['temperature'] ?? 0.5,
            'messages' => [[
                'role' => 'user',
                'content' => $prompt
            ]]
        ];

        if (isset($options['response_format'])) {
            $schema = $options['response_format']['json_schema']['schema'] ?? null;
            if ($schema) {
                $body['messages'][0]['content'] .= "\n\nRespond with valid JSON matching this schema: " . json_encode($schema);
            }
        }

        return self::invokeModel($modelId, $body);
    }

    public static function createCompletionAsync(string $prompt, array $options = [])
    {
        $modelId = $options['model'] ?? config('zunou.bedrock.model');

        $body = [
            'anthropic_version' => 'bedrock-2023-05-31',
            'max_tokens'        => $options['max_tokens'] ?? 1024,
            'temperature'       => $options['temperature'] ?? 0.5,
            'messages'          => [
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ]
            ]
        ];

        if (isset($options['response_format'])) {
            $schema = $options['response_format']['json_schema']['schema'] ?? null;

            if ($schema) {
                $body['messages'][0]['content'] .=
                    "\n\nReturn ONLY valid JSON. " .
                    "Do not include line breaks inside string values. " .
                    "Escape all newline characters as \\n. " .
                    "Match this schema exactly: " . json_encode($schema);
            }
        }

        return self::invokeModelAsync($modelId, $body);
    }

    public static function createStructuredAsync(string $modelId, string $prompt, array $function)
    {
        $client = self::getClient();

        $body = [
            'modelId' => $modelId,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        ['text' => $prompt]
                    ]
                ]
            ],
            'toolConfig' => [
                'tools' => [
                    [
                        'toolSpec' => [
                            'name' => $function['name'],
                            'description' => $function['description'],
                            'inputSchema' => [
                                'json' => [
                                    'type' => 'object',
                                    'properties' => $function['parameters']['properties'],
                                    'required' => array_keys($function['parameters']['properties'])
                                ]
                            ]
                        ]
                    ]
                ],
                'toolChoice' => [
                    'tool' => ['name' => $function['name']]
                ]
            ]
        ];

        // Helper to convert Aws\Result to array
        $convertToArray = function ($result) {
            if (is_object($result) && method_exists($result, 'toArray')) {
                return $result->toArray();
            }
            if (is_object($result) && $result instanceof \ArrayAccess) {
                return (array) $result;
            }
            return $result;
        };

        return $client->converseAsync($body)
            ->then(function ($result) use ($convertToArray) {
                // The converse API returns a structured response, not a body to decode
                // Response structure: output, stopReason, usage, metrics, etc.
                $arrayResult = $convertToArray($result);
                Log::debug("Bedrock converse response", ['result' => $arrayResult]);
                return $arrayResult;
            })
            ->otherwise(function ($e) use ($body) {
                Log::error("Bedrock structured explicit async error: {$e->getMessage()}", [
                    'body' => $body,
                    'exception' => get_class($e),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            });
    }
}
