<?php

namespace App\Services\MCP;

use App\Helpers\CountryHelper;
use App\Schemas\BaseSchema;
use Carbon\Carbon;
use DateTimeZone;
use Illuminate\Support\Facades\Log;
use stdClass;

class JiraMCP extends MCPIntegration
{
    public function getSystemPrompt(): string
    {
        $credentials = $this->agent->credentials;

        if (!isset($credentials['url'])) {
            // get the accessible atlassian resources

            $response = $this->session->callTool('getAccessibleAtlassianResources', []);
            if (!$response['isError']) {
                $contentJson = $response['content'][0]['text'];
                $content = json_decode($contentJson, true);

                $additionalCredentials = [
                    'id' => $content[0]['id'],
                    'url' => $content[0]['url'],
                    'name' => $content[0]['name'],
                    'avatarUrl' => $content[0]['avatarUrl'],
                ];
                $this->agent->credentials = array_merge($credentials, $additionalCredentials);
                $this->agent->save();
                $credentials = $this->agent->credentials;
            }
        }

        $guidelines = $this->agent->guidelines;

        $prompt = <<<PROMPT
You are an autonomous Jira agent with comprehensive access to project management operations, issue tracking, and workflow navigation capabilities. Your primary role is to proactively assist with Jira-related tasks and provide intelligent, actionable responses.

## User Preferences & Guidelines
$guidelines

## User'Jira Account Basic Information

a. Attlasian URL: {$credentials['url']} -> Use this to navigate to the Jira project. useful for creating links to the project.
b. Attlasian Name: {$credentials['name']}


## Your Capabilities
You can perform the following operations to the project:

**Issue Management:**
- Create, update, assign, and transition Jira issues
- Add comments, attachments, and work logs to issues
- Modify issue fields such as priority, status, and labels
- Link related issues and manage issue dependencies
- Search and filter issues using complex JQL queries

**Project & Board Operations:**
- Browse Jira projects, boards, epics, and sprints
- Retrieve and analyze board configurations and sprint statuses
- Monitor project progress and sprint velocity
- Understand workflows, transitions, and issue types

**Insight & Reporting:**
- Generate insights based on sprint performance, issue trends, and burndown data
- Identify blockers, bottlenecks, and overdue issues
- Suggest improvements to workflows, issue triage, and sprint planning

## Your Approach
1. **Be Proactive**: When given a task, think step-by-step about what information you need and what actions to take
2. **Use Available Tools**: Leverage Jira's APIs and queries to gather and analyze information before making decisions
3. **Provide Context**: Always explain your reasoning and provide relevant details from your findings
4. **Suggest Actions**: Recommend next steps, issue updates, or process improvements when appropriate
5. **Be Thorough**: Go beyond the surface request—consider dependencies, blockers, and overall project health
6. Do not add parent.
7. Make sure that there is no duplicates in Issue. Perform a search first before creating the issue.
8. When mentioning a Task number always add a link use this {$credentials['url']}/browse/**task_id**

## Working with the Project
You are working with the Jira project. Always consider the current state of issues, sprints, and workflows when making recommendations or performing operations.

When asked to help with tasks, start by understanding the current context, then use the appropriate tools to gather information, and finally provide actionable insights or perform the requested operations.
PROMPT;

        return $this->buildSystemPrompt($prompt);
    }

    public static function routeToolDefinition(): array
    {
        $mentionKeyword = self::getMentionKeyword();

        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithJiraAgent',
                'description' => "Sends a message to the Jira agent and returns its response. Should be called when {$mentionKeyword} is mentioned",
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the Jira agent.',
                        ],
                    ],
                    'required' => ['message'],
                ],
            ],
        ];
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
    A list of actionable links that allow the user to navigate directly to specific features or entities within the application. In user case this will be the issue or links, project links user profile links.
    
    This is only available for Task Entity and Note Entity. Meetings and User links are not supported yet.
    Each item must represent a real, clickable link that takes the user to a concrete location in the app.
    
    Task references will point the task to the task view page. The reference uses the ID only as a link.
    
    Here are the required properties for each reference/uri:
    - The `title` is the label shown to the user.
    - The `id` is the unique identifier of the entity being linked (e.g., task ID).
    - The `type` indicates the kind of entity (e.g., task, project, user).
    
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
                            'url' => [
                                'type'        => 'string',
                                'description' => 'The url of the feature or entity linked to jira. Should be retrieved from the system not randomly generated.',
                            ],
                            'type' => [
                                'type'        => 'string',
                                'enum'        => ['external_link'],
                                'description' => 'The type of the link, for jira it is always external_link',
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
        return '@jira';
    }
}
