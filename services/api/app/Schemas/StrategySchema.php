<?php

namespace App\Schemas;

class StrategySchema
{
    public const EXTRACT_STRATEGY_META = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'extract_strategy_meta',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'title' => [
                        'type' => 'string',
                    ],
                    'description' => [
                        'type'        => 'string',
                        'description' => 'This is the human-readable description of what the strategy does. Format will be in a single paragraph form.',
                    ],
                    'prompt_description' => [
                        'type'        => 'string',
                        'description' => 'This is the technical description used for AI processing. It contains specific details about how the strategy operates based on its type (mission or automation).',
                    ],
                    'isSuccess' => [
                        'type'        => 'boolean',
                        'description' => 'Whether the strategy is feasible or not.',
                    ],
                ],
                'required' => [
                    'title',
                    'description',
                    'prompt_description',
                    'isSuccess',
                ],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
}
