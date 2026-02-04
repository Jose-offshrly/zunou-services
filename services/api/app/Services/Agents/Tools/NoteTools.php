<?php

namespace App\Services\Agents\Tools;

class NoteTools
{
    public const createNotes = [
        'type'     => 'function',
        'function' => [
            'name'        => 'createNotes',
            'description' => 'Create and save note to database.',
            'parameters'  => [
                'type'       => 'object',
                'required'   => ['title'],
                'properties' => [
                    'title' => [
                        'type'        => 'string',
                        'description' => 'The title of the note.',
                    ],
                    'content' => [
                        'type'        => 'string',
                        'description' => 'The main content of the note.',
                    ],
                    'labels' => [
                        'type'        => 'array',
                        'description' => 'The labels or tags of the note.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'pinned' => [
                        'type'        => 'boolean',
                        'description' => 'Whether the note is pinned. Default is false. Only true when user explicitly asks to pin the note.',
                    ],
                    'position' => [
                        'type'        => 'integer',
                        'description' => 'The position of the note.',
                    ],
                ],
                'additionalProperties' => false,
            ],
        ],
    ];
    
    public const updateNotes = [
        'type'     => 'function',
        'function' => [
            'name'        => 'updateNotes',
            'description' => 'Update an existing note in the database.',
            'parameters'  => [
                'type'       => 'object',
                'required'   => ['id'],
                'properties' => [
                    'id' => [
                        'type'        => 'string',
                        'description' => 'The id of the note.',
                    ],
                    'title' => [
                        'type'        => 'string',
                        'description' => 'The updated title of the note.',
                    ],
                    'content' => [
                        'type' => 'string',
                        'description' => 'The updated note content with added updates. If the content uses HTML tags (e.g., <p>- item</p>), preserve the structure and add new updates using the same HTML tag pattern. Do not overwrite the original content unless the user explicitly asks to. Do not escape slashes or HTML tags — return raw HTML like <p>, not <\\/p> or &lt;p&gt;.',
                    ],
                    'labels_to_add' => [
                        'type'        => 'array',
                        'description' => 'The labels or tags to be added to the note.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'labels_to_remove' => [
                        'type'        => 'array',
                        'description' => 'The labels or tags to be removed from the note.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'remove_all_labels' => [
                        'type'        => 'boolean',
                        'description' => 'Set true if user explicitly asks to remove all labels from the note. Overrides labels_to_remove.',
                    ],
                    'pinned' => [
                        'type'        => 'boolean',
                        'description' => 'Whether the note is pinned or not.',
                    ],
                ],
                'additionalProperties' => false,
            ],
        ],
    ];
    
    public const deleteNote = [
        'type'     => 'function',
        'function' => [
            'name'        => 'deleteNote',
            'description' => 'Delete an existing note(s) in the database.',
            'parameters'  => [
                'type'       => 'object',
                'required'   => ['ids', 'confirmed'],
                'properties' => [
                    'ids' => [
                        'type'        => 'array',
                        'description' => 'The ids of the notes.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'confirmed' => [
                        'type'        => 'boolean',
                        'description' => 'Must be true only if the agent already asked the user “Are you sure you want to delete this note?” and the user explicitly confirmed. Do not call this function immediately after the user requests deletion. The agent must ask for confirmation first.',
                    ],
                ],
                'additionalProperties' => false,
            ],
        ],
    ];

    public const searchNotes = [
        'type'     => 'function',
        'function' => [
            'name'        => 'searchNotes',
            'description' => 'Search for notes by title or content',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'keyword' => [
                        'description' => 'Search keyword to match against note titles or contents',
                        'type'        => 'string',
                    ],
                ],
                'required' => ['keyword'],
            ],
        ],
    ];

    public const queryNotes = [
        'type'     => 'function',
        'function' => [
            'name'        => 'queryNotes',
            'description' => 'Query the database for notes. Add filters only if relevant to the user\'s request. If no date range provided, return the latest notes.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'pinned' => [
                        'description' => 'Whether to filter notes that are pinned.',
                        'type'        => 'boolean',
                    ],
                    'created_at_range' => [
                        'description' => 'Date range to filter notes by creation date. If user pass a relative date, convert it to the correct format. Format: YYYY-MM-DD.',
                        'type'        => 'object',
                        'properties'  => [
                            'from' => [
                                'description' => 'Start date of the range (inclusive). Format: YYYY-MM-DD.',
                                'type'        => 'string',
                                'format'      => 'date',
                            ],
                            'to' => [
                                'description' => 'End date of the range (inclusive). Format: YYYY-MM-DD.',
                                'type'        => 'string',
                                'format'      => 'date',
                            ],
                        ],
                        'required'             => ['from', 'to'],
                        'additionalProperties' => false,
                    ],
                    'ownership' => [
                        'description' => 'Filter notes by ownership. By default, return all notes.',
                        'type'        => 'string',
                        'enum'        => ['all', 'mine'],
                    ],
                    'search_keywords' => [
                        'description' => 'Search keywords to match in note title or content.',
                        'type'        => 'array',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                ],
                'required'             => ["ownership"],
                'additionalProperties' => false,
            ],
        ],
    ];

    public const getNoteDetails = [
        'type'     => 'function',
        'function' => [
            'name'        => 'getNoteDetails',
            'description' => 'Retrieve detailed information about a single note. This is used to fetch the full context — including title, content, labels, pinned status, and creation/update dates. Always call this tool whenever user passed in note name or note id.',
            'parameters'  => [
                'type'       => 'object',
                'required'   => ['id'],
                'properties' => [
                    'id' => [
                        'type'        => 'string',
                        'description' => 'The UUID of the note to retrieve details for.',
                    ],
                ],
                'additionalProperties' => false,
            ],
        ],
    ];
}
