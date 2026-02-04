<?php

namespace App\Schemas;

class OrgChartSchema
{
    public const OptionsSchema = [
        'type'       => 'object',
        'properties' => [
            'type' => [
                'type' => 'string',
                'enum' => ['options'],
            ],
            'options' => [
                'type'        => 'array',
                'description' => <<<DESC
A list of relevant orgchart-related entities or system-suggested actions based on the user's query.
Use this always when helpful.
Use this when:
- Multiple user records or actionable options match the user’s intent
- The assistant wants to guide the user with **precise next-step actions**, Example:
    user: "Find developer for this task 'Develope API'
    after findind the developer, present the user with the options to assign the developer to the task.
    Include `name`, `email` in the option_context.
DESC
                ,
                'items' => [
                    'type'       => 'object',
                    'properties' => [
                        'label' => [
                            'type'        => 'string',
                            'description' => 'A concise name/title for the task or action being suggested.',
                        ],
                        'suggested_reply' => [
                            'type'        => 'string',
                            'description' => 'A natural-language message that will be auto-filled into the user’s input when selected. It should sound like something a person would naturally type, be specific and task-focused, and directly fulfill the assistant’s current prompt. Avoid including user IDs or UUIDs — users don’t have access to internal system identifiers — and avoid technical commands or vague responses.',
                        ],
                        'option_context' => [
                            'type'        => 'object',
                            'description' => 'Additional context used to enrich and distinguish the option in the UI. Includes real data such as assignees, due date, status, and priority for tasks — never invented or abstract.',
                            'properties'  => [
                                'email' => [
                                    'type'        => 'string',
                                    'description' => 'Email of the user. Omit this if no email.',
                                ],
                            ],
                            'required'             => [],
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
                'description' => 'Allows selecting multiple options if true. Defaults to false.',
            ],
        ],
        'required'             => ['type', 'options', 'multi_select'],
        'additionalProperties' => false,
    ];
}
