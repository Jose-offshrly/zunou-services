<?php

namespace App\Schemas;

class MeetingSchema
{
    /**
     * JSON schema definition for a generated meeting summary.
     * This schema is used for structuring data for meeting summaries.
     *
     * @var array
     */
    public const GENERATED_SUMMARY = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'meeting_summary',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'summary' => [
                        'type' => 'string',
                    ],
                    'content' => [
                        'type'  => 'array',
                        'items' => [
                            'type'       => 'object',
                            'properties' => [
                                'summary_id' => [
                                    'type' => 'string',
                                ],
                                'text' => [
                                    'type' => 'string',
                                ],
                            ],
                            'required'             => ['summary_id', 'text'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                'required'             => ['summary', 'content'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];

    public const GENERATED_SUMMARY_DATA = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'meeting_summary',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'summary' => [
                        'type'        => 'string',
                        'description' => 'A comprehensive markdown-formatted summary of the meeting, covering all major points, decisions, and key takeaways in a numbered list format. Keep markdown formatting intact.',
                    ],
                    'action_items' => [
                        'type'        => 'array',
                        'description' => 'A list of clear, detailed, and assigned action items derived from the meeting.',
                        'items'       => [
                            'type'     => 'object',
                            'required' => [
                                'name',
                                'description',
                                'status',
                                'priority',
                                'due_date',
                                'assignees',
                            ],
                            'additionalProperties' => false,
                            'properties'           => [
                                'name' => [
                                    'type'        => 'string',
                                    'description' => 'Short title or label for the action item.',
                                ],
                                'description' => [
                                    'type'        => 'string',
                                    'description' => 'Detailed explanation of what needs to be done as a natural sentence. Explicitly mention the assignees first name and their roles in the task if there are multiple assignees, but do it in natural sentence.',
                                ],
                                'assignees' => [
                                    'type'        => 'array',
                                    'items'       => [
                                        'type' => 'string',
                                        'description' => 'The full name of the person. Do not include other text other than the name.',
                                    ],
                                    'description' => 'The person or team responsible for completing the task. If no assignee, return empty array. If the description explicitly indicates that the task is for all team members (e.g., "all members", "everyone", "the whole team"), return the array with a single value: ["EVERYONE"].',
                                ],
                                'status' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'Not Started',
                                        'In Progress',
                                        'Done',
                                    ],
                                    'description' => "Current status of the task. One of: 'Not Started', 'In Progress', or 'Done'.",
                                ],
                                'priority' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'Low',
                                        'Medium',
                                        'High',
                                        'Urgent',
                                    ],
                                    'description' => 'Priority level of the task.',
                                ],
                                'due_date' => [
                                    'type'        => ['string', 'null'],
                                    'description' => 'Deadline for the task in ISO 8601 format (e.g., 2025-04-04).',
                                ],
                            ],
                        ],
                    ],
                    'potential_strategy' => [
                        'type'        => 'array',
                        'description' => 'A list of 2–3 potential strategies or ideas discussed in the meeting, which may help address challenges or improve performance.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'metadata' => [
                        'type'        => 'object',
                        'description' => 'Additional contextual metadata about the meeting.',
                        'required'    => [
                            'headline',
                            'meeting_name',
                            'meeting_date',
                            'attendees',
                        ],
                        'properties' => [
                            'headline' => [
                                'type'        => 'string',
                                'description' => 'Headline in the format: "The [title of meeting] Summary is now available! Highlight key: [key_highlight]".',
                            ],
                            'meeting_name' => [
                                'type'        => 'string',
                                'description' => 'The name or title of the meeting.',
                            ],
                            'meeting_date' => [
                                'type'        => 'string',
                                'description' => 'The date of the meeting in ISO 8601 format (e.g., 2025-05-02T10:00:00Z).',
                            ],
                            'attendees' => [
                                'type'        => 'string',
                                'description' => 'Participants of the meeting. If no attendees, return "No attendees".',
                            ],
                        ],
                        'additionalProperties' => false,
                    ],
                ],
                'required' => [
                    'summary',
                    'action_items',
                    'potential_strategy',
                    'metadata',
                ],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
    
    public const GENERATED_SUMMARY_DATA_ONLY = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'meeting_summary',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'summary' => [
                        'type'        => 'string',
                        'description' => 'A comprehensive markdown-formatted summary of the meeting, covering all major points, decisions, and key takeaways in a numbered list format. Keep markdown formatting intact.',
                    ],
                    'potential_strategy' => [
                        'type'        => 'array',
                        'description' => 'A list of 2–3 potential strategies or ideas discussed in the meeting, which may help address challenges or improve performance.',
                        'items'       => [
                            'type' => 'string',
                        ],
                    ],
                    'metadata' => [
                        'type'        => 'object',
                        'description' => 'Additional contextual metadata about the meeting.',
                        'required'    => [
                            'headline',
                            'meeting_name',
                            'meeting_date',
                            'attendees',
                        ],
                        'properties' => [
                            'headline' => [
                                'type'        => 'string',
                                'description' => 'Headline in the format: "The [title of meeting] Summary is now available! Highlight key: [key_highlight]".',
                            ],
                            'meeting_name' => [
                                'type'        => 'string',
                                'description' => 'The name or title of the meeting.',
                            ],
                            'meeting_date' => [
                                'type'        => 'string',
                                'description' => 'The date of the meeting in ISO 8601 format (e.g., 2025-05-02T10:00:00Z).',
                            ],
                            'attendees' => [
                                'type'        => 'string',
                                'description' => 'Participants of the meeting. If no attendees, return "No attendees".',
                            ],
                        ],
                        'additionalProperties' => false,
                    ],
                ],
                'required' => [
                    'summary',
                    'potential_strategy',
                    'metadata',
                ],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];
   
    public const GENERATED_ACTION_ITEMS_DATA = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'meeting_action_items',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'action_items' => [
                        'type'        => 'array',
                        'description' => 'A list of clear, detailed, and assigned action items derived from the meeting.',
                        'items'       => [
                            'type'     => 'object',
                            'required' => [
                                'name',
                                'description',
                                'status',
                                'priority',
                                'due_date',
                                'assignees',
                            ],
                            'additionalProperties' => false,
                            'properties'           => [
                                'name' => [
                                    'type'        => 'string',
                                    'description' => 'Short title or label for the action item.',
                                ],
                                'description' => [
                                    'type'        => 'string',
                                    'description' => 'Detailed explanation of what needs to be done as a natural sentence. Explicitly mention the assignees first name and their roles in the task if there are multiple assignees, but do it in natural sentence.',
                                ],
                                'assignees' => [
                                    'type'        => 'array',
                                    'items'       => [
                                        'type' => 'string',
                                        'description' => 'The full name of the person. Do not include other text other than the name.',
                                    ],
                                    'description' => 'The person or team responsible for completing the task. If no assignee, return empty array. If the description explicitly indicates that the task is for all team members (e.g., "all members", "everyone", "the whole team"), return the array with a single value: ["EVERYONE"].',
                                ],
                                'status' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'Not Started',
                                        'In Progress',
                                        'Done',
                                    ],
                                    'description' => "Current status of the task. One of: 'Not Started', 'In Progress', or 'Done'.",
                                ],
                                'priority' => [
                                    'type' => 'string',
                                    'enum' => [
                                        'Low',
                                        'Medium',
                                        'High',
                                        'Urgent',
                                    ],
                                    'description' => 'Priority level of the task.',
                                ],
                                'due_date' => [
                                    'type'        => ['string', 'null'],
                                    'description' => 'Deadline for the task in ISO 8601 format (e.g., 2025-04-04).',
                                ],
                            ],
                        ],
                    ],
                ],
                'required' => [
                    'action_items',
                ],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];

    /**
     * JSON schema definition for a generated meeting list.
     * This schema is used for structuring data for meeting list.
     *
     * @var array
     */
    public const MEETINGS_LIST = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'meetings_list',
            'schema' => [
                'type'       => 'object',
                'properties' => [
                    'type' => [
                        'type' => 'string',
                        'enum' => ['meeting_list'],
                    ],
                    'message' => [
                        'type' => 'string',
                    ],
                    'data' => [
                        'type'       => 'object',
                        'properties' => [
                            'meetings' => [
                                'type'  => 'array',
                                'items' => [
                                    'type'       => 'object',
                                    'properties' => [
                                        'id' => [
                                            'type' => 'string',
                                        ],
                                        'meeting_id' => [
                                            'type' => 'string',
                                        ],
                                        'pulse_id' => [
                                            'type' => 'string',
                                        ],
                                        'user_id' => [
                                            'type' => 'string',
                                        ],
                                        'title' => [
                                            'type' => 'string',
                                        ],
                                        'date' => [
                                            'type' => 'string',
                                        ],
                                        'is_viewable' => [
                                            'type' => 'boolean',
                                        ],
                                    ],
                                    'required' => [
                                        'id',
                                        'meeting_id',
                                        'pulse_id',
                                        'user_id',
                                        'title',
                                        'date',
                                        'is_viewable',
                                    ],
                                    'additionalProperties' => false,
                                ],
                            ],
                        ],
                        'required'             => ['meetings'],
                        'additionalProperties' => false,
                    ],
                ],
                'required'             => ['type', 'message', 'data'],
                'additionalProperties' => false,
            ],
            'strict' => true,
        ],
    ];

    public const OptionsSchema = [
        'type'       => 'object',
        'properties' => [
            'type' => [
                'type' => 'string',
                'enum' => ['options'],
            ],
            'options' => [
                'type'        => 'array',
                'description' => 'A list of known entities or actionable suggestions directly grounded in system data or inference. Used when multiple records or responses match the user’s intent. If the options exceed 10, present the latest 10 then ask the user below if want to see more options.',
                'items'       => [
                    'type'       => 'object',
                    'properties' => [
                        'label' => [
                            'type'        => 'string',
                            'description' => 'A human-readable title that helps the user identify this option; for meetings, use the meeting title only — exclude date and organizer, which should go in the context field (required).',
                        ],
                        'suggested_reply' => [
                            'type'        => 'string',
                            'description' => 'A natural-language message that will be auto-filled into the user’s input when selected. It should sound like something a person would type, directly fulfill the assistant’s prompt, and avoid technical references like task IDs or commands. ✅ Example: "Assign Mark to the \'Update API Docs\' task" ❌ Bad: "Assign 8d731f42-94c3-4e67-bf62-cc75c3b1e58a to Mark".',
                        ],
                        'option_context' => [
                            'type'        => 'object',
                            'description' => 'Added context data used to enrich this option visually or semantically. Reserved for future use; must be based on real data, not imagined values. Always incude if available.',
                            'properties'  => [
                                'date' => [
                                    'type'        => 'string',
                                    'description' => 'Date of the meeting. Human readable format (e.g., Mon, 24 Jun 2025). Required if available, omit this if no date.',
                                ],
                                'organizer' => [
                                    'type'        => 'string',
                                    'description' => 'Name of the organizer of the meeting. Required if available, omit this if no organizer.',
                                ],
                                'source' => [
                                    'type'        => 'string',
                                    'enum'        => ['fireflies', 'pulse'],
                                    'description' => 'Source of the meeting. Required if available, omit this if no source.',
                                ],
                            ],
                            'required'             => ['date', 'organizer', 'source'],
                            'additionalProperties' => false,
                        ],
                    ],
                    'required'             => ['label', 'suggested_reply'],
                    'additionalProperties' => false,
                ],
            ],
            'multi_select' => [
                'type'        => 'boolean',
                'description' => 'If true, the user may select more than one option. Defaults to false.',
            ],
        ],
        'required'             => ['type', 'options', 'multi_select'],
        'additionalProperties' => false,
    ];
}
