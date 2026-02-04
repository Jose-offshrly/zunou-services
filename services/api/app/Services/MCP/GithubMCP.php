<?php

namespace App\Services\MCP;

use App\Helpers\CountryHelper;
use App\Schemas\BaseSchema;
use Carbon\Carbon;
use DateTimeZone;

class GithubMCP extends MCPIntegration
{
    public const PR_TOOLS = [
        'create_pull_request',
        'get_pull_request',
        'update_pull_request',
        'merge_pull_request',
        'list_pull_requests',
        'get_pull_request_files',
        'get_pull_request_diff',
        'get_pull_request_status',
        'update_pull_request_branch',
        'create_pending_pull_request_review',
        'add_pull_request_review_comment_to_pending_review',
        'submit_pending_pull_request_review',
        'delete_pending_pull_request_review',
        'get_pull_request_reviews',
        'get_pull_request_comments',
        'create_and_submit_pull_request_review',
    ];

    public const REPO_TOOLS = [
        'get_file_contents',
        'list_branches',
        'list_commits',
        'get_commit',
        'list_tags',
        'get_tag',
    ];

    public const SEARCH_TOOLS = [
        'search_repositories',
        'search_issues',
        'search_pull_requests',
        'search_code',
        'search_users',
        'search_orgs',
    ];

    public const GET_CONTEXT_TOOLS = [
        'get_me',
        'get_team_members',
        'get_teams',
    ];

    public function getSystemPrompt(): string
    {
        $credentials = $this->agent->credentials;
        $workspace   = $credentials['workspace'] ?? 'not specified';

        $guidelines = $this->agent->guidelines;

        $prompt = <<<PROMPT
You are an autonomous GitHub agent with comprehensive access to repository operations, pull request management, and code search capabilities. Your primary role is to proactively assist with GitHub-related tasks and provide intelligent, actionable responses.

## User Preferences & Guidelines
$guidelines

## Your Capabilities
Before doing actions call the needed context about user by using the get_me, get_team_members, get_teams tools. This tools provide context about user and their github profile.
Workspace: $workspace

**Pull Request Operations:**
- Create, update, merge, and review pull requests
- List and analyze pull request files, diffs, and status
- Manage pull request reviews and comments
- Update pull request branches
- Always keep the user's preferences in mind when making decisions and responding.

**Repository Operations:**
- Read file contents and browse repository structure
- List branches, commits, and tags
- Analyze commit history and changes

**Search Operations:**
- Search across repositories, issues, pull requests, code, users, and organizations
- Find specific content and patterns within the codebase

## Your Approach
1. **Be Proactive**: When given a task, think step-by-step about what information you need and what actions to take
2. **Use Available Tools**: Leverage the appropriate tools to gather information before making decisions
3. **Provide Context**: Always explain your reasoning and provide relevant details from your findings
4. **Suggest Actions**: When appropriate, suggest next steps or improvements based on your analysis
5. **Be Thorough**: Don't just answer the immediate question - consider related aspects and potential issues

## Working with the Repository
You are working with the $workspace repository. Always consider the current state of the repository when making recommendations or performing operations.

When asked to help with tasks, start by understanding the current context, then use the appropriate tools to gather information, and finally provide actionable insights or perform the requested operations.
PROMPT;

        return $this->buildSystemPrompt($prompt);
    }

    public static function routeToolDefinition(): array
    {
        return [
            'type'     => 'function',
            'function' => [
                'name'        => 'communicateWithGithubAgent',
                'description' => 'Sends a message to the Github agent and returns its response.',
                'parameters'  => [
                    'type'       => 'object',
                    'properties' => [
                        'message' => [
                            'type'        => 'string',
                            'description' => 'The message or instruction for the Github agent.',
                        ],
                    ],
                    'required' => ['message'],
                ],
            ],
        ];
    }

    public function getTools(): array
    {
        $toolsObject   = $this->session->listTools();
        $includedTools = array_merge(
            self::GET_CONTEXT_TOOLS,
            self::PR_TOOLS,
            self::REPO_TOOLS,
            self::SEARCH_TOOLS,
        );
        $parsedTools   = $this->transformInputToOpenAITool($toolsObject['tools']);
        $filteredTools = collect($parsedTools)
            ->filter(
                fn ($tool) => in_array($tool['function']['name'], $includedTools),
            )
            ->values()
            ->toArray();
        return $filteredTools;
    }

    public function getResponseSchema(): ?array
    {
        return BaseSchema::getResponseSchema([
            BaseSchema::OptionsSchema,
            BaseSchema::ConfirmationSchema,
        ]);
    }
}
