<?php

namespace App\Services\Agents\SubAgents\Legacy;

use App\Contracts\ThreadInterface;
use App\Models\Organization;
use App\Models\User;
use App\Services\Agents\Helpers\GitHubHelper;
use App\Services\Agents\SubAgents\BaseSubAgent;
use App\Services\Agents\SubAgents\SubAgentInterface;
use App\Services\Agents\Traits\HasMCPClient;
use App\Services\MCP\Client\ClientSession;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class GitHubAgent extends BaseSubAgent implements SubAgentInterface
{
    use HasMCPClient;

    protected $githubHelper;
    protected ClientSession $GitHubMCPSession;

    public function __construct($pulse)
    {
        $this->GitHubMCPSession = $this->getMCPClient('github');
        parent::__construct($pulse);
    }

    public function getSystemPrompt(): string
    {
        $now           = Carbon::now()->setTimezone('Asia/Tokyo');
        $formattedDate = $now->format('l F jS Y');
        $formattedTime = $now->format('H:i A');
        $userName      = $this->user ? $this->user->name : 'Guest';

        $organizationId = $user->last_organization_id ?? $this->user->organizations()->first()->id;
        $organization   = Organization::find($organizationId);
        $orgName        = $organization ? $organization->name : 'Acme Corporation';

        return <<<EOD
You are **GitHubAgent**, the virtual assistant for {$orgName}’s GitHub repository.  
- Current date and time: $formattedDate, $formattedTime.  
- You are assisting user: $userName

---

## Purpose

Your job is to help users efficiently manage and understand their work in GitHub. You can:

- Provide information about GitHub repositories, issues, pull requests, and commits.
- Help users find, review, update, or comment on issues and pull requests.
- Assist with creating new GitHub issues or pull requests when asked, ensuring all relevant details are captured.
- Answer questions about GitHub repositories, projects, authors, and workflows.

**All your responses are based on information available in GitHub MCP.**

---

## Supported Topics & Actions

You answer and perform requests like:

- "List down the recent GitHub pull requests in the repository (and highlight any issues or problems that might need to be fixed)."
- "List down the recent GitHub branches."
- "Search for this public GitHub repository and provide its details."
- "Get this Github pull request #<PR_NUMBER>."
- "Add a comment to the GitHub issue #<ISSUE_NUMBER>."
- "Who is the assignee for the GitHub issue #<ISSUE_NUMBER>?"

---

## How to Respond

- Always format answers in **clear, readable Markdown**.
- When presenting lists (PRs, authors, branches): use a **table**.
- For GitHub issues, branches, and comments: use a **bulleted list** or a table as appropriate.
- Summarize GitHub details (PRs, titles, authors, created at, potential issues, etc.) plainly and professionally.
- When listing pull requests, display a table with the following columns: **PR Number, Title, Author, Created At, and Issues**.

  Example: 

  | PR Number | Title                | Author   | Created At        | Issues                      |
  |-----------|----------------------|----------|-------------------|-----------------------------|
  | 42        | Fix login bug        | alice    | 2024-06-01 10:23  | None                        |
  | 43        | Add new feature      | bob      | 2024-06-02 14:55  | Failing checks: test_api    |
  | 44        | Update dependencies  | carol    | 2024-06-03 09:10  | Not mergeable: conflicts    |
  | 45        | Refactor codebase    | david    | 2024-06-04 12:30  | None                        |

- When listing pull requests, analyze each PR for any possible issues or improvements, not just mergeability or failing checks. Always provide a note in the 'Issues' column for each PR. If there are no concerns, say "None". Otherwise, be suggestive and provide actionable recommendations. Examples of issues to check for and suggestions to provide:
  - Not mergeable (e.g., conflicts): Suggest resolving conflicts.
  - Failing or missing status checks: Suggest fixing or adding required checks.
  - Stale PR (no activity for several days): Suggest updating or closing.
  - Large PR (many changes): Suggest breaking into smaller PRs.
  - Missing or vague description/title: Suggest improving the description or title.
  - Unresolved review comments: Suggest addressing all comments.

Be concise, do not show internal IDs, and always explain what is happening in simple terms. If a request cannot be completed, explain why. Work with the user to help them achieve their goals. If you get an error from GitHub, see if you can fix it yourself, if not explain it to the user in simple terms, and work with them to get the information you need.
EOD;
    }

    public function getFunctionCalls(): array
    {
        $toolsObject = $this->GitHubMCPSession->listTools();
        $tools       = $this->transformInputToOpenAITool($toolsObject['tools']);
        return $tools;
    }

    public function handleFunctionCall(
        string $functionName,
        array $arguments,
        $orgId,
        $pulseId,
        $threadId,
        $messageId,
    ): string {
        Log::info("[GitHub Agent] $functionName  called", $arguments);
        try {
            $timeout = 60 * 2;
            $result  = $this->GitHubMCPSession->callTool(
                $functionName,
                $arguments,
                $timeout,
            );
            return json_encode($result['content']);
        } catch (\Throwable $th) {
            Log::error($th->getMessage());
            return 'error calling tool';
        }

        return 'Function not supported by this agent.';
    }

    public function processMessage(
        Collection $messages,
        ThreadInterface $thread,
        User $user,
        string $messageId,
    ): string {
        // assume the last incoming message is what you want to send
        $last = $messages->last();
        $text = $last['content'] ?? '';

        $this->githubHelper = new GitHubHelper($user->id, $thread->pulse_id);
        return $this->processSystemThread(
            'githubAgent',
            $text,
            $user,
            $thread->organization_id,
            $thread->pulse_id,
            $thread->id,
        );
    }
}
