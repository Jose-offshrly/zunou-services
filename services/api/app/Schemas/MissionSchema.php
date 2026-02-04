<?php

namespace App\Schemas;

class MissionSchema
{
    public const MISSION_RESPONSE = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'mission_response',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'summary' => [
                        'type'        => 'string',
                        'description' => 'Your actual response to the user not summary, saying that the mission [the mission] is being created. Make sure it\'s in present tence.',
                    ],
                    'title' => [
                        'type'        => 'string',
                        'description' => 'The title of the mission',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'The human-readable description of what this mission aims to accomplish. This should be in high-level language that users can understand.',
                    ],
                    'prompt_description' => [
                        'type'        => 'string',
                        'description' => 'The technical description used for context-based responses and mission execution. This should contain specific details about how the mission processes and understands context.',
                    ],
                    'strategy' => [
                        'type'        => 'string',
                        'description' => 'The strategy type of mission',
                    ],
                    'isSuccess' => [
                        'type'        => 'boolean',
                        'description' => 'Whether the mission is feasible or not',
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
}
