<?php

namespace App\Services\Agents\Tools;

class RetrievalTools
{
    public const findDataSource = [
        'type'     => 'function',
        'function' => [
            'name'        => 'findDataSource',
            'description' => 'Find the relevant data source in knowledge base.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'query' => [
                        'type'        => 'string',
                        'description' => 'The complete question or query of the user to answer',
                    ],
                ],
                'required' => ['query'],
            ],
        ],
    ];

    public const searchDataSourceByTitle = [
        'type'     => 'function',
        'function' => [
            'name'        => 'searchDataSourceByTitle',
            'description' => 'Search for a file in the knowledge base by its title and optionally by file extension.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'title' => [
                        'type'        => 'string',
                        'description' => 'Partial or full title of the file to search for.',
                    ],
                    'extension' => [
                        'type'        => 'string',
                        'description' => 'Optional file extension to narrow down the search (e.g., "pdf", "docx").',
                    ],
                ],
                'required' => ['title'],
            ],
        ],
    ];

    public const retrieveMeetings = [
        'type'     => 'function',
        'function' => [
            'name'        => 'retrieveMeetings',
            'description' => 'Retrieve meetings based on structured date filters like most recent, today, or a specific date.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'filterType' => [
                        'type'        => 'string',
                        'enum'        => ['most_recent', 'date_range'],
                        'description' => "The type of filter to apply. Use 'most_recent' or 'date_range'.",
                    ],
                    'startDate' => [
                        'type'        => 'string',
                        'format'      => 'date',
                        'description' => "Start date in YYYY-MM-DD format. Required if filterType is 'date_range' otherwise leave it empty.",
                    ],
                    'endDate' => [
                        'type'        => 'string',
                        'format'      => 'date',
                        'description' => "End date in YYYY-MM-DD format. Required if filterType is 'date_range' otherwise leave it empty.",
                    ],
                ],
                'required' => ['filterType'],
            ],
        ],
    ];

    public const queryDataSource = [
        'type'     => 'function',
        'function' => [
            'name'        => 'queryDataSource',
            'description' => 'Answer the user\'s question based oin found data source. If the user is asking for just the name of the document, no need to call this tool.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'query' => [
                        'type'        => 'string',
                        'description' => 'The query of the user to answer',
                    ],
                    'data_source_id' => [
                        'type'        => 'string',
                        'description' => 'The data source id found in knowledge base',
                    ],
                ],
                'required' => ['query', 'data_source_id'],
            ],
        ],
    ];

    public const downloadDataSource = [
        'type'     => 'function',
        'function' => [
            'name'        => 'downloadDataSource',
            'description' => 'Generate a download link for the data source',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'data_source_name' => [
                        'type'        => 'string',
                        'description' => 'The name of the data source to download',
                    ],
                    'data_source_id' => [
                        'type'        => 'string',
                        'description' => 'The data source id found in knowledge base',
                    ],
                ],
                'required' => ['data_source_name', 'data_source_id'],
            ],
        ],
    ];

    public const listDataSources = [
        'type'     => 'function',
        'function' => [
            'name'        => 'listDataSources',
            'description' => 'List data sources from the knowledge base, optionally filtered by upload date. Defaults to most recent first. Maximum 20 results.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'date_from' => [
                        'type'        => 'string',
                        'format'      => 'date',
                        'description' => 'Optional start date for filtering (inclusive). Format: YYYY-MM-DD',
                    ],
                    'date_to' => [
                        'type'        => 'string',
                        'format'      => 'date',
                        'description' => 'Optional end date for filtering (inclusive). Format: YYYY-MM-DD',
                    ],
                    'skip' => [
                        'type'        => 'integer',
                        'minimum'     => 0,
                        'description' => 'Number of items to skip. Useful for pagination.',
                    ],
                    'take' => [
                        'type'        => 'integer',
                        'minimum'     => 1,
                        'maximum'     => 20,
                        'description' => 'Number of items to return. Maximum is 20. Default is 10',
                    ],
                ],
                'required' => [],
            ],
        ],
    ];
}
