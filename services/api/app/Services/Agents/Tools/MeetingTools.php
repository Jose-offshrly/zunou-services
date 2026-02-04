<?php

namespace App\Services\Agents\Tools;

class MeetingTools
{
    public const retrievedMeetingSummary = [
        'type'     => 'function',
        'function' => [
            'name'        => 'retrievedMeetingSummary',
            'description' => 'Retrive the summary of a meeting',
            'parameters'  => [
                'properties' => [
                    'meeting_data_source_id' => [
                        'description' => 'The data_source_id of the meeting data source.',
                        'type'        => 'string',
                    ],
                ],
                'required' => ['meeting_data_source_id'],
                'type'     => 'object',
            ],
        ],
    ];

    public const getMeetings = [
        'type'     => 'function',
        'function' => [
            'name'        => 'getMeetings',
            'description' => 'Retrieve meetings from the database',
            'parameters'  => [
                'properties' => [
                    'acknowledgment' => [
                        'type'        => 'string',
                        'description' => 'Short acknowledgement response to the user. This will served as reply to user saying the heres the list of meetings you request, something like that. Always end your response with. Here\'s the list:. Its important because i will display the list below that',
                    ],
                    'query' => [
                        'properties' => [
                            'fromDate' => [
                                'default'     => null,
                                'description' => 'Return all meetings after fromDate. The fromDate parameter accepts a date-time string in the ISO 8601 format, specifically in the form YYYY-MM-DDTHH:mm.sssZ. For example, a valid timestamp would be 2024-07-08T22:13:46.660Z.',
                                'format'      => 'date-time',
                                'type'        => 'string',
                            ],
                            'toDate' => [
                                'default'     => null,
                                'description' => 'Return all meetings before toDate. The toDate parameter accepts a date-time string in the ISO 8601 format, specifically in the form YYYY-MM-DDTHH:mm.sssZ. For example, a valid timestamp would be 2024-07-08T22:13:46.660Z.',
                                'format'      => 'date-time',
                                'type'        => 'string',
                            ],
                            'limit' => [
                                'default'     => 15,
                                'description' => 'Number of transcripts to return. Maximum 15 in one query',
                                'type'        => 'integer',
                            ],
                            'skip' => [
                                'default'     => 0,
                                'description' => 'Number of meetings to skip. defaults to 0',
                                'type'        => 'integer',
                            ],
                            'has_summary' => [
                                'default'     => false,
                                'description' => 'Boolean flag whether to return all meetings or only the meeting that already has summary',
                                'type'        => 'boolean',
                            ],
                        ],
                        'type'     => 'object',
                        'required' => ['limit', 'skip', 'has_summary'],
                    ],
                ],
                'required' => ['query', 'acknowledgment'],
                'type'     => 'object',
            ],
        ],
    ];
}
