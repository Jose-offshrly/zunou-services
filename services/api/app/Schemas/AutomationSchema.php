<?php

namespace App\Schemas;

class AutomationSchema
{
    /**
     * JSON schema definition for a generated automation.
     * This schema is used for structuring data for automation.
     *
     * @var array
     */
    public const AUTOMATION_RESPONSE = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'automation_response',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'summary' => [
                        'type'        => 'string',
                        'description' => 'Your actual response to the user not summary, saying that the automation [the automation] is being created. Make sure it\'s in present tense.',
                    ],
                    'title' => [
                        'type'        => 'string',
                        'description' => 'The title of the automation, If the tools to be used is not enough or cannot be used, title will be "Automation Incomplete".',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'The human-readable description of what this automation does. This should be in high-level language that users can understand.',
                    ],
                    'prompt_description' => [
                        'type'        => 'string',
                        'description' => 'The technical dscription used for tool-based responses and automation execution. This should contain specific details about how the automation interacts with tools and processes.',
                    ],
                    'strategy' => [
                        'type'        => 'string',
                        'description' => 'The strategy type of automation',
                    ],
                    'isSuccess' => [
                        'type'        => 'boolean',
                        'description' => 'Indicates whether the necessary tools are available to execute the automation.',
                    ],
                ],
                'required' => [
                    'summary',
                    'title',
                    'description',
                    'prompt_description',
                    'strategy',
                    'isSuccess',
                ],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
    /**
     * JSON schema definition for extracting automation type and schedule.
     *
     * @var array
     */
    public const EXTRACT_TYPE_SCHEDULE = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'extract_type_schedule',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'type' => [
                        'type' => 'string',
                        'enum' => [
                            'hourly',
                            'daily',
                            'weekly',
                            'monthly',
                            'yearly',
                        ],
                    ],
                    'next_run_at' => [
                        'type' => 'string',
                    ],
                ],
                'required'             => ['type', 'next_run_at'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
}
