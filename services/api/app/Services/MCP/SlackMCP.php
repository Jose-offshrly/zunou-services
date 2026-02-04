<?php

namespace App\Services\MCP;

use App\Schemas\BaseSchema;
use App\Services\MCP\Client\ClientSession;
use Illuminate\Support\Facades\Log;

class SlackMCP extends MCPIntegration
{
    public function getSystemPrompt(): string
    {
        $guidelines = $this->agent->guidelines;

        $botToken = isset($this->agent->credentials['key']) ? "Completed" : "Not completed";
        $teamId = "list channels to get the team id and channel ids";
        $channelIds = $this->agent->credentials['channel_ids'] ?? "Not set";

        $prompt = <<<PROMPT
You are an autonomous Slack agent with comprehensive access to messaging, workspace collaboration, and channel management capabilities. Your primary role is to proactively assist with Slack-related tasks and provide intelligent, actionable responses.
You are like a bot in slack

## Requirements needed to complete for the agent to run. 
Here are the requirements needed to run the agent. This will be provided by the user.

1. Slack Bot Setup: {$botToken}

The user should create app themselves in slack and provide the bot token. You can guide them on how to do it. You don't have the ability or tools to create the app on behalf of the user or even join a workspace or channel.

2. Team ID: {$teamId}

Determine the team id and channel ids from the available tools. if no team id is found, ask the user to provide the team ID.

2. Channel IDs: {$channelIds} (optional)

This is required only if the user wants to access private channels. You don't have the ability or tools to get the private channel IDs on behalf of the user. You can guide however the user on how to get it in slack.
Work with public channels unless they explicitly ask for private channels.

## User Preferences & Guidelines
$guidelines

## Your Capabilities
You can perform the following operations within the Slack workspace:

**Messaging & Communication:**
- Send, schedule, edit, and delete messages in channels and DMs
- Format text with markdown, block kits, and attachments
- React to messages with emojis and manage threads
- Share files, images, and links within conversations

**Channel & Workspace Operations:**
- Browse, create, and archive channels (public and private)
- Invite, remove, or manage members in channels
- Retrieve channel information and recent activity
- Organize discussions with topics and pinned messages

**User & App Interactions:**
- Look up user profiles, availability, and status
- Manage user groups and mentions
- Interact with Slack apps, bots, and workflows
- Handle slash commands and shortcuts

**Insight & Reporting:**
- Summarize conversations, threads, or channel activity
- Identify important announcements, unresolved questions, and action items
- Suggest better communication practices or automation opportunities
- Highlight trends in engagement, responsiveness, or sentiment

## Your Approach
1. **Be Proactive**: When given a task, think step-by-step about what information you need and what actions to take
2. **Use Available Tools**: Leverage Slack's APIs and queries to gather and analyze information before making decisions
3. **Provide Context**: Always explain your reasoning and provide relevant details from your findings
4. **Suggest Actions**: Recommend next steps, issue updates, or process improvements when appropriate
5. **Be Thorough**: Go beyond the surface request—consider dependencies, blockers, and overall project health
6. Do not add parent.
7. Always add the sender name whenever listing messages.
PROMPT;

        return $this->buildSystemPrompt($prompt);
    }

    public static function routeToolDefinition(): array
    {
        $mentionKeyword = self::getMentionKeyword();

        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithSlackAgent',
                'description' => "Sends a message to the Slack agent and returns its response.
                When to use:
                - If the user message is **Slack-related** (posting messages, replying in threads, retrieving Slack content, etc.).  
                - If the message is a **reply to a previous Slack query or Slack Agent response** (continue the same context).
                - If user mentions you {$mentionKeyword}",
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the Slack agent. Pass the complete message including information needed to understand the user\'s request.',
                        ],
                    ],
                    'required' => ['message'],
                ],
            ],
        ];
    }

    protected function getStreamableHttpSession(): ClientSession
    {
        $credentials = $this->agent->credentials;
        $botToken      = $credentials['key'];

        $options = [
            'connection_timeout' => 10.0,
            'read_timeout' => 30.0,
            'verify_ssl' => true,
        ];

        // agent_type -> make sure the config name and agent_type field on ai_agents table matches (case insensitive)
        $agentType = strtolower($this->agent->agent_type);
        $url = config("mcp.servers.{$agentType}.url");

        $headers = ['X-Slack-Bot-Token' => $botToken];

        $headers['X-Slack-Team-Id'] = '---';

        if (isset($this->agent->credentials['channel_ids'])) {
            $headers['X-Slack-Channel-Ids'] = implode(', ', $this->agent->credentials['channel_ids']);
        }

        $session = $this->mcpClientManager->createStreamableHttpSession(
            $url,
            $headers,
            $options,
            strtolower($this->agent->agent_type),
        );
        $session->initialize();
        return $session;
    }

    public function getResponseSchema(): ?array
    {
        $referencesSchema = [
            'type'       => 'object',
            'properties' => [
                'type' => [
                    'type' => 'string',
                    'enum' => ['references'],
                ],
                'references' => [
                    'type'        => 'array',
                    'description' => <<<DESC
                A list of direct Slack links that the user can click to open a specific Slack location.  

                Supported links:
                - Messages  
                - Threads  
                - Channels  
                - Other Slack entities (e.g., task-related links shown inside Slack)  

                Rules:
                - Each item must be a valid Slack URL (not generated or placeholder).  
                - Include only links from the **current tool response**. If 3 tasks are returned, provide exactly 3 references. Do not reuse tasks from earlier conversations.  
                - Do not use for generic text or non-links — only for real, actionable Slack links.  

                Each reference requires:
                - `title`: Text label shown to the user.  
                - `url`: Direct Slack URL (message, channel, or thread).  
                - `type`: Always `external_link`.  
                DESC
                    ,
                    'items' => [
                        'type'       => 'object',
                        'properties' => [
                            'title' => [
                                'type'        => 'string',
                                'description' => 'The label or text shown to the user for the link.',
                            ],
                            'url' => [
                                'type'        => 'string',
                                'description' => 'Direct Slack URL (e.g., https://app.slack.com/client/{team_id_here}/{channel_id_here}).',
                            ],
                            'type' => [
                                'type'        => 'string',
                                'enum'        => ['external_link'],
                                'description' => 'Always `external_link` for Slack.',
                            ],
                        ],
                        'required'             => ['title', 'url', 'type'],
                        'additionalProperties' => false,
                    ],
                ],
            ],
            'required'             => ['type', 'references'],
            'additionalProperties' => false,
        ];

        return BaseSchema::getResponseSchema([
            $referencesSchema,
            BaseSchema::OptionsSchema,
            BaseSchema::ConfirmationSchema,
        ]);
    }

    public static function getMentionKeyword(): string
    {
        return '@slack';
    }


    // public function getCustomTools(): array
    // {
    //     return [
    //         [
    //             'type'     => 'function',
    //             'function' => [
    //                 'name'        => 'setTeamId',
    //                 'description' => 'Set the team ID or Workspace ID for slack. This is required before using the agent.',
    //                 'parameters'  => [
    //                     'type'       => 'object',
    //                     'properties' => [
    //                         'team_id' => [
    //                             'type'        => 'string',
    //                             'description' => 'The team ID or Workspace ID for slack.',
    //                         ],
    //                     ],
    //                     'required' => ['team_id'],
    //                     'additionalProperties' => false,
    //                 ],
    //             ],
    //         ]
    //     ];
    // }

    public function handleCustomFunctionCall(string $functionName, array $arguments)
    {
        switch ($functionName) {
            case 'setTeamId':
                $currentCredentials = $this->agent->credentials;

                Log::info('Setting team ID', ['team_id' => $arguments['team_id']]);
                $currentCredentials['team_id'] = $arguments['team_id'];
                $this->agent->credentials = $currentCredentials;
                $this->agent->save();

                // refresh the session
                $this->session = $this->initializeSession();
                return 'Team ID set successfully';
            default:
                return self::NO_HANDLER_FOUND;
        }
    }
}
