<?php

namespace App\Services\Agents\Shared;

class ToolDefinitionRegistry
{
    /**
     * Define the MCP tool call function
     */
    public static function useMcpTool(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'useMcpTool',
                'description' => 'Use a tool provided by a connected MCP server',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'server_name' => [
                            'type'        => 'string',
                            'description' => 'The name of the MCP server providing the tool',
                        ],
                        'tool_name' => [
                            'type'        => 'string',
                            'description' => 'The name of the tool to execute',
                        ],
                        'arguments' => [
                            'type'        => 'object',
                            'description' => "The tool's input parameters, following the tool's input schema",
                        ],
                    ],
                    'required' => ['server_name', 'tool_name'],
                ],
            ],
        ];
    }

    public static function communicateWithAWSScalerAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithAWSScalerAgent',
                'description' => 'Sends a scaling instruction to the AWSScalerAgent.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'A natural language scaling instruction, e.g. "Scale meet-bot to 1".',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    /**
     * Define the MCP resource access function
     */
    public static function accessMcpResource(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'accessMcpResource',
                'description' => 'Access a resource provided by a connected MCP server',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'server_name' => [
                            'type'        => 'string',
                            'description' => 'The name of the MCP server providing the resource',
                        ],
                        'uri' => [
                            'type'        => 'string',
                            'description' => 'The URI identifying the specific resource to access',
                        ],
                    ],
                    'required' => ['server_name', 'uri'],
                ],
            ],
        ];
    }

    public static function communicateWithDataSourceAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithDataSourceAgent',
                'description' => 'Sends a message to the DataSourceAgent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The user\'s original question for the DataSourceAgent to answer.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function communicateWithMeetingAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithMeetingAgent',
                'description' => 'Sends a message to the MeetingAgent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the MeetingAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    /**
     * Direct exposure of MeetingAgent's generateMeetingSummary tool
     * This bypasses the nested agent communication loop for better performance
     */
    public static function meetingAgent_generateMeetingSummary(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'meetingAgent_generateMeetingSummary',
                'description' => 'Generate a summary for a specific meeting. Use this tool whenever the user asks for a meeting summary, rather than using communicateWithMeetingAgent. The message must be a complete, self-contained message that includes all necessary meeting details provided by the user.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'A complete, self-contained message containing all meeting information needed to generate the summary.',
                        ],
                    ],
                    'required' => ['message'],
                ],
            ],
        ];
    }

    public static function communicateWithTaskAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithTaskAgent',
                'description' => 'Sends a message to the TaskAgent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the TaskAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function communicateWithOrgChartAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithOrgChartAgent',
                'description' => 'Sends a message to the OrganizationChartAgent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the OrganizationChartAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }
   
    public static function communicateWithNotesAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithNotesAgent',
                'description' => 'Sends a message to the NotesAgent and returns its response. Everything note related questions should be answered with this tool.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the NotesAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function communicateWithGitHubAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithGitHubAgent',
                'description' => 'Sends a message to the GitHubAgent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the GitHubAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function generateAutomation(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'generateAutomation',
                'description' => 'Generates an automation for any given strategy.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'automation_description' => [
                            'type'        => 'string',
                            'description' => 'The raw automation input provided by the user.',
                        ],
                    ],
                    'required' => ['automation_description'],
                ],
            ],
        ];
    }

    public static function generateMission(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'generateMission',
                'description' => 'Generates a mission for any given strategy.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'mission_description' => [
                            'type'        => 'string',
                            'description' => 'The raw mission input provided by the user.',
                        ],
                    ],
                    'required' => ['mission_description'],
                ],
            ],
        ];
    }

    public static function lookupSpreadsheet(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'lookupSpreadsheet',
                'description' => 'Retrieve information from a spreadsheet datasource. Get the datasource ID using lookupInformation first then call this function.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'prompt' => [
                            'type'        => 'string',
                            'description' => 'The natural language query describing what data to fetch from the spreadsheet.',
                        ],
                        'data_source_id' => [
                            'type'        => 'string',
                            'description' => 'The unique ID of the spreadsheet datasource to query.',
                        ],
                    ],
                    'required' => ['query', 'data_source_id'],
                ],
            ],
        ];
    }

    public static function translateVideo(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'translateVideo',
                'description' => 'Translate any audio in a video to the target language (only english or japanese supported now).  Check if the video is already in the required language and dont use this unless you have to, it is expensive.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'target_language' => [
                            'type'        => 'string',
                            'description' => 'Options are "en" for english, "ja" for japanese. Only translate to another language if you have to. Dont translate to the same language.',
                        ],
                        'data_source_id' => [
                            'type'        => 'string',
                            'description' => 'The ID of the datasource referencing the video, be careful to get this correct.',
                        ],
                    ],
                    'required' => ['target_language', 'data_source_id'],
                ],
            ],
        ];
    }

    public static function communicateWithGettingStartedAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithGettingStartedAgent',
                'description' => 'Sends a message to the GettingStartedAgent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the GettingStartedAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function suggestNewInformation(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'suggestNewInformation',
                'description' => 'As a last resort, notifies the admin team when the system lacks information.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'prompt' => [
                            'type'        => 'string',
                            'description' => 'The full question that could not be answered.',
                        ],
                    ],
                    'required' => ['prompt'],
                ],
            ],
        ];
    }

    public static function communicateWithDirectMessagesAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithDirectMessagesAgent',
                'description' => 'Use this tool to handle any task related to direct messaging, such as reading messages, sending new messages, checking unread messages, or finding conversations with a specific user.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the DirectMessagesAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function communicateWithTeamChatAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithTeamChatAgent',
                'description' => 'Use this tool to handle team chat operations such as posting updates, summaries, notes, or notifications to team channels with proper attribution.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the TeamChatAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }

    public static function communicateWithPulseAgent(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithPulseAgent',
                'description' => 'Use this tool to communicate with other pulses in the organization. This allows you to route queries to specific pulses and get their responses.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the PulseAgent.',
                        ],
                        'step_number' => [
                            'type'        => 'integer',
                            'description' => 'The execution step number for tracking purposes. Use when orchestrating multiple agent calls to maintain execution order.',
                        ],
                        'is_final' => [
                            'type'        => 'boolean',
                            'description' => 'Set to true if this is the final step in the execution sequence. Used for orchestration and determining when to return the final response to the user.',
                        ],
                    ],
                    'required' => ['message', 'step_number', 'is_final'],
                ],
            ],
        ];
    }
    
}
