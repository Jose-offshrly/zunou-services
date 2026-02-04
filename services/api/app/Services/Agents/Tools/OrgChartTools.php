<?php

namespace App\Services\Agents\Tools;

class OrgChartTools
{
    public const listGroups = [
        'type'     => 'function',
        'function' => [
            'name'        => 'listGroups',
            'description' => 'List groups in the organization',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'page' => [
                        'description' => 'The page number for pagination. Default to 1',
                        'type'        => 'number',
                        'minimum'     => 1,
                    ],
                    'per_page' => [
                        'description' => 'The number of groups to return per page. Default to 2',
                        'type'        => 'number',
                        'minimum'     => 1,
                        'maximum'     => 2,
                    ],
                ],
                'required' => ['page', 'per_page'],
            ],
        ],
    ];

    public const listGroupMembers = [
        'type'     => 'function',
        'function' => [
            'name'        => 'listGroupMembers',
            'description' => 'List group members in the organization',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'group_id' => [
                        'description' => 'The id (UUID format) of group',
                        'type'        => 'string',
                    ],
                    'page' => [
                        'description' => 'The page number for pagination. Default to 1',
                        'type'        => 'number',
                        'minimum'     => 1,
                    ],
                    'per_page' => [
                        'description' => 'The number of members to return per page. Default to 10',
                        'type'        => 'number',
                        'minimum'     => 1,
                        'maximum'     => 50,
                    ],
                ],
                'required' => ['group_id', 'page', 'per_page'],
            ],
        ],
    ];

    public const listAllMembers = [
        'type'     => 'function',
        'function' => [
            'name'        => 'listAllMembers',
            'description' => 'Retrieve a paginated list of all members in the organization.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'unassigned_only' => [
                        'description' => 'If true, only return members not assigned to any group.',
                        'type'        => 'boolean',
                        'default'     => false,
                    ],
                    'page' => [
                        'description' => 'Page number for pagination (defaults to 1).',
                        'type'        => 'number',
                        'minimum'     => 1,
                    ],
                    'per_page' => [
                        'description' => 'Number of members per page (defaults to 10, maximum 50).',
                        'type'        => 'number',
                        'minimum'     => 1,
                        'maximum'     => 50,
                    ],
                ],
                'required' => ['unassigned_only', 'page', 'per_page'],
            ],
        ],
    ];

    public const getMemberInfo = [
        'type'     => 'function',
        'function' => [
            'name'        => 'getMemberInfo',
            'description' => 'Retrieve detailed information about a member based on a provided search query. The query can be a full name, partial name (first or last), or an email address. Returns member details including full name, job title, responsibilities, group memberships, and other relevant job information.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'member_name' => [
                        'description' => 'Search query for identifying the member. Accepts partial or full names (first name, last name, or full name) or a full email address. The input should be a string with at least one character.',
                        'type'        => 'string',
                        'minLength'   => 1,
                    ],
                    'search_criteria' => [
                        'type'        => 'string',
                        'enum'        => ['name', 'email'],
                        'description' => 'The search criteria or type',
                    ],
                ],
                'required' => ['member_name', 'search_criteria'],
            ],
        ],
    ];

    public const searchMembersByJobInformation = [
        'type'     => 'function',
        'function' => [
            'name'        => 'searchMembersByJobInformation',
            'description' => 'Search members based on a natural language query describing job responsibilities, skills, or roles.',
            'parameters'  => [
                'type'       => 'object',
                'properties' => [
                    'job_information' => [
                        'description' => 'A natural language query describing the job role, skill, or responsibility to search for. Example: "Who can handle API work?" or "Find someone with frontend experience.',
                        'type'  => 'string',
                        'minLength'   => 1,
                    ],
                ],
                'required' => ['job_information'],
            ],
        ],
    ];
}
