<?php

namespace App\Schemas;

class DataSourceSchema
{
    /**
     * JSON schema definition for a data source response.
     * This schema is used for structuring data for lookup data source.
     *
     * @var array
     */
    public const LookupInformationResponse = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'lookupInformationResponse',
            'schema' => [
                'properties' => [
                    'summary' => [
                        'description' => 'Your complete response to the user in markdown or plain text. This is not summary of the complete answer. Return the complete answer to the user question',
                        'type'        => 'string',
                    ],
                    'content' => [
                        'description'          => 'An array of source citations directly referenced in the answer. Exclude sources used solely for internal reasoning. Leave as an empty list [] if no data sources are needed. Multiple citations to different parts of the same document are allowed, each represented as a separate object.',
                        'type'                 => 'array',
                        'additionalProperties' => false,
                        'items'                => [
                            'additionalProperties' => false,
                            'type'                 => 'object',
                            'required'             => [
                                'data_source_id',
                                'data_source_type',
                                'text_excerpt',
                                'text',
                                'page_number',
                            ],
                            'properties' => [
                                'page_number' => [
                                    'description' => 'The page number of the document',
                                    'type'        => 'integer',
                                ],
                                'data_source_id' => [
                                    'description' => "The ID of the data source in the knowledge base. It was labeled 'Data Source Id' or 'data_source_id' in the document metadata",
                                    'type'        => 'string',
                                ],
                                'data_source_type' => [
                                    'description' => "The type of data of data source being referenced. Please don't make up any different formats. This was given on document metadata",
                                    'type'        => 'string',
                                    'enum'        => [
                                        'mp4',
                                        'xls',
                                        'xlsx',
                                        'doc',
                                        'docx',
                                        'ppt',
                                        'pptx',
                                        'rtx',
                                        'csv',
                                        'html',
                                        'pdf',
                                        'text',
                                    ],
                                ],
                                'text' => [
                                    'description' => 'Required. A portion of your overall response that is directly supported by this specific part of the file (e.g., a chunk, section, or page). Make it short, clean and concise 1-2 sentence summary, avoid newlines and other formatting.',
                                    'type'        => 'string',
                                ],
                                'text_excerpt' => [
                                    'description' => 'An exact snippet copied directly from the source document that supports the answer. Return only the first 2-3 sentences to keep it concise. The snippet must match the original text exactly, including casing and punctuation. This is used internally for highlighting in the document.',
                                    'type'        => 'string',
                                ],
                            ],
                        ],
                    ],
                ],
                'required'             => ['summary', 'content'],
                'type'                 => 'object',
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
}
