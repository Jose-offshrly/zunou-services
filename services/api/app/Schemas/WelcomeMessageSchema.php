<?php

namespace App\Schemas;

class WelcomeMessageSchema
{
    public const AI_WELCOME_MESSAGE = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'ai_welcome_message',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'messages' => [
                        'type'        => 'array',
                        'description' => 'An array of message parts for the welcome message.',
                        'items'       => [
                            'type'       => 'object',
                            'properties' => [
                                'text' => [
                                    'type'        => 'string',
                                    'description' => 'A part of the actual welcome message.',
                                ],
                                'type' => [
                                    'type'        => 'string',
                                    'description' => 'Type of the message (text, user, team message, data source, etc.).',
                                    'enum'        => [
                                        'text',
                                        'team_message',
                                        'data_source',
                                        'meeting',
                                        'task',
                                    ],
                                ],
                                'metadata' => [
                                    'type'        => ['object', 'null'],
                                    'description' => 'Additional information about the message, such as id, name, etc.',
                                    'properties'  => [
                                        'id' => [
                                            'type'        => 'string',
                                            'description' => 'The id of the entity (user, team message, data source, etc.)',
                                        ],
                                        'name' => [
                                            'type'        => 'string',
                                            'description' => 'The name of the entity (user, team message, data source, etc.)',
                                        ],
                                        // Add more fields here if needed (e.g., 'email', 'role', etc.)
                                    ],
                                    'required'             => ['id', 'name'],
                                    'additionalProperties' => false,
                                ],
                            ],
                            'required'             => ['text', 'type', 'metadata'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                'required'             => ['messages'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
}
