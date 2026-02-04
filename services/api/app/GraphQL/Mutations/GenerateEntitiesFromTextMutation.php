<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Services\OpenAIService;
use Carbon\Carbon;

final readonly class GenerateEntitiesFromTextMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        $now           = Carbon::now()->setTimezone('Asia/Tokyo');
        $formattedDate = $now->format('l F jS Y');
        $formattedTime = $now->format('H:i A');

        $prompt = <<<PROMPT
You are a helpful assistant that can extract entities from given free form text.

For context, It is $formattedDate. We are in Japan. It is $formattedTime.
Leave the fields null if not necessary.
PROMPT;

        $fields = json_decode($args['fields'] ?? '{}', true) ?: [];

        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'extract_entities',
                'schema' => [
                    'type'                 => 'object',
                    'properties'           => $fields,
                    'required'             => array_keys($fields),
                    'additionalProperties' => false,
                ],
                'strict' => true,
            ],
        ];

        $response = OpenAIService::createCompletion([
            'model'    => config('zunou.openai.model'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => $prompt,
                ],
                [
                    'role'    => 'user',
                    'content' => $args['input'],
                ],
            ],
            'n'               => 1,
            'response_format' => $schema,
        ]);

        $message = $response['choices'][0]['message'];
        return json_encode(json_decode($message['content'], true));
    }
}
