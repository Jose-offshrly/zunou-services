<?php

namespace App\Services\Agents\Tools;

class BaseTools
{
    public const reportUnableToAnswerAndReroute = [
        'type'     => 'function',
        'function' => [
            'name'        => 'reportUnableToAnswerAndReroute',
            'description' => 'Use this tool when I cannot answer the user’s query due to missing information, out-of-scope content, or irrelevant context. This signals the system to reroute the query to another agent or fallback handler.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'original_query' => [
                        'type'        => 'string',
                        'description' => 'The original user query I could not handle.',
                    ],
                    'reason' => [
                        'type'        => 'string',
                        'description' => 'A brief explanation of why I cannot handle the query (e.g., outside my domain, insufficient data, unrelated topic).',
                    ],
                ],
                'required' => ['original_query', 'reason'],
            ],
        ],
    ];
}
