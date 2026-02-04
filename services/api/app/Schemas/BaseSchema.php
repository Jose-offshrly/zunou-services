<?php

namespace App\Schemas;

class BaseSchema
{
    public const ReferencesSchema = [
        'type'       => 'object',
        'properties' => [
            'type' => [
                'type' => 'string',
                'enum' => ['references'],
            ],
            'references' => [
                'type'        => 'array',
                'description' => <<<DESC
A list of actionable links that allow the user to navigate directly to specific features or entities within the application.

This is only available for Task Entity and Note Entity. Meetings and User links are not supported yet.
Each item must represent a real, clickable link that takes the user to a concrete location in the app.

Task references will point the task to the task view page. The reference uses the ID only as a link.

Here are the properties for each reference/uri:
- The `title` is the label shown to the user.
- The `id` is the unique identifier of the entity being linked (e.g., task ID).
- The `type` indicates the kind of entity (e.g., task, note, external_link).
- The `url` is the external link if the link points to external endpoint.

Important: Strictly use the tasks outputted by the current tool for listing references. DO NOT use the tasks from previous responses. If the current tool return 3 tasks, return 3 references only. DO not add the tasks from previous conversations.

**Do not use this for generic or non-link references. Only use for actual, actionable links to system entities that the user can click to navigate.**
DESC
                ,
                'items' => [
                    'type'       => 'object',
                    'properties' => [
                        'title' => [
                            'type'        => 'string',
                            'description' => 'The label or text shown to the user for the link.',
                        ],
                        'id' => [
                            'type'        => 'string',
                            'description' => 'The unique id of the feature or entity being linked (e.g., meeting, task, note, Jira ticket, etc.). Formatted as UUID and should be retrieved from the system not randomly generated.',
                        ],
                        'type' => [
                            'type'        => 'string',
                            'enum'        => ['task', 'note', 'team_chat', 'external_link'],
                            'description' => 'The type of the link (e.g., task, note, team_chat, external_link). Support task, note, team_chat, and external_link for now.',
                        ],
                        'url' => [
                            'type'        => 'string',
                            'description' => 'the url of the external link.',
                        ],
                        'pulse_id' => [
                            'type'        => 'string',
                            'description' => 'The id of the pulse.'
                        ]
                    ],
                    'required'             => ['title', 'id', 'type'],
                    'additionalProperties' => false,
                ],
            ],
        ],
        'required'             => ['type', 'references'],
        'additionalProperties' => false,
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
                'description' => 'A list of known entities or actionable suggestions directly grounded in system data or inference. Used when multiple records or responses match the user’s intent.',
                'items'       => [
                    'type'       => 'object',
                    'properties' => [
                        'label' => [
                            'type'        => 'string',
                            'description' => 'A human-readable title that helps the user identify this option.',
                        ],
                        'suggested_reply' => [
                            'type'        => 'string',
                            'description' => 'A natural-language message that will be auto-filled into the user’s input when selected. It should sound like something a person would type, directly fulfill the assistant’s prompt, and avoid technical references like task IDs or commands. ✅ Example: "Assign Mark to the \'Update API Docs\' task" ❌ Bad: "Assign 8d731f42-94c3-4e67-bf62-cc75c3b1e58a to Mark".',
                        ],
                        'option_context' => [
                            'type'                 => 'object',
                            'description'          => 'Optional context data used to enrich this option visually or semantically. Reserved for future use; must be based on real data, not imagined values.',
                            'additionalProperties' => true,
                        ],
                    ],
                    'required' => [
                        'label',
                        'suggested_reply',
                        'option_context',
                    ],
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

    public const ConfirmationSchema = [
        'type'       => 'object',
        'properties' => [
            'type' => [
                'type' => 'string',
                'enum' => ['confirmation'],
            ],
            'confirmation' => [
                'type'        => 'object',
                'description' => 'A prompt asking the user to explicitly confirm or reject a possible action, especially when the assistant needs user validation before proceeding.',
                'properties'  => [
                    'prompt' => [
                        'type'        => 'string',
                        'description' => 'The confirmation question shown to the user. Must be clear and actionable, typically a yes/no question.',
                    ],
                    'actions' => [
                        'type'        => 'array',
                        'description' => 'A list of available responses for the user to confirm or reject. Usually includes two options, like "Yes" and "No".',
                        'items'       => [
                            'type'       => 'object',
                            'properties' => [
                                'label' => [
                                    'type'        => 'string',
                                    'description' => 'Short text shown on the button (e.g., Yes, No, Confirm, Cancel).',
                                ],
                                'suggested_reply' => [
                                    'type'        => 'string',
                                    'description' => 'A natural-language message that will be auto-filled into the user’s input when selected. It should sound like something a person would naturally type, be specific and task-focused, and directly fulfill the assistant’s current prompt. Avoid including task IDs or UUIDs — users don’t have access to internal system identifiers — and avoid technical commands or vague responses.',
                                ],
                            ],
                            'required'             => ['label', 'suggested_reply'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                'required'             => ['prompt', 'actions'],
                'additionalProperties' => false,
            ],
        ],
        'required'             => ['type', 'confirmation'],
        'additionalProperties' => false,
    ];

    public const AIResponseSchema = [
        'type'        => 'json_schema',
        'json_schema' => [
            'name'   => 'AIResponseSchema',
            'schema' => [
                'type'                 => 'object',
                'required'             => ['message'],
                'additionalProperties' => false,
                'description'          => <<<DESC
Instructs the assistant to return a structured response that may include interactive UI elements alongside the main message.

This is useful when the assistant needs to guide the user with:
- Helpful links across the app
- Disambiguation choices (e.g., multiple matches)
- Yes/no confirmation before proceeding with an action

CRITICAL: Always rely strictly on facts provided by tool responses. Never fabricate, infer, assume, or generate missing information based on partial data. Example: if a tool returns only a name, do not try to come up with email addresses, phone numbers, or other contact details based on that name - only use what was explicitly provided.

Only one type of UI element is allowed per response.
DESC
                ,
                'properties' => [
                    'message' => [
                        'type'        => 'string',
                        'description' => 'The main text response from the assistant. This is shown directly to the user and should summarize the outcome, prompt for a decision, or provide necessary context for the UI element that follows.',
                    ],
                    'ui' => [
                        'description' => 'Optional container for an interactive UI element the assistant wants to render alongside the message. Only one of the supported types may be used in a single response.',
                        'oneOf'       => [
                            self::ReferencesSchema,
                            self::OptionsSchema,
                            self::ConfirmationSchema,
                        ],
                    ],
                ],
                'strict' => true,
            ],
        ],
    ];

    public static function getResponseSchema(
        ?array $includedSchemas = [],
    ): array {
        $baseSchema = self::AIResponseSchema;

        if (empty($includedSchemas)) {
            return $baseSchema;
        }

        $baseSchema['json_schema']['schema']['properties']['ui'][
            'oneOf'
        ] = $includedSchemas;

        return $baseSchema;
    }
}
