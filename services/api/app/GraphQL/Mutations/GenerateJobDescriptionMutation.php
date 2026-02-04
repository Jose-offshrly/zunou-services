<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations;

use App\Models\PulseMember;
use App\Services\OpenAIService;

final readonly class GenerateJobDescriptionMutation
{
    /** @param  array{}  $args */
    public function __invoke(null $_, array $args)
    {
        if (!isset($args['organizationUserId'])) {
            throw new \Exception('User ID not provided');
        }

        $user = PulseMember::findOrFail($args['organizationUserId']);
        if (!$user) {
            throw new \Exception('User not found');
        }

        if ($user->organizationUser) {
            $jobTitle = $user->organizationUser->job_title ?? "not specified";
        } else {
            $jobTitle = "not specified";
        }

        $name = $user->user->name;

        $prompt = <<<PROMPT
Generate a concise job description for the role of **$jobTitle**.  
If job title is not specified, generate a generic job description like a member of a company or organization.

Guidelines:  
- Keep the description short and directly relevant to the role.  
- Provide exactly 3 key responsibilities.  
- Do not include any other text, explanations, or comments.  
- Do not mention the employee's name in the description.  

Output format:  
Job Description: <short description>  
Responsibilities:  
   <responsibility one>  
   <responsibility two>  
   <responsibility three>  
PROMPT;

        $schema = [
            'type'        => 'json_schema',
            'json_schema' => [
                'name'   => 'generate_job_description',
                'schema' => [
                    'type'                 => 'object',
                    'properties'           => [
                        'jobDescription' => [
                            'type' => 'string',
                            'description'  => 'The generated job description for ' . $name,
                        ],
                        'responsibilities' => [
                            'type' => 'array',
                            'description'  => 'The generated responsibilities for ' . $name,
                            'items' => [
                                'type' => 'string',
                            ],
                        ],
                    ],
                    'required'             => ['jobDescription', 'responsibilities'],
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
            ],
            'n'               => 1,
            'response_format' => $schema,
        ]);

        $responseJson = $response->choices[0]->message->content;
        $content = json_decode($responseJson, true);

        return $content;
    }
}
